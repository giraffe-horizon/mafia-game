import type {
  D1Database,
  GameRow,
  GamePlayerRow,
  GameStateResponse,
  PublicPlayer,
  CharacterRow,
} from "@/db/types";
import { generateSessionCode, now, nanoid } from "@/db/helpers";
import { getPhaseProgress, getVoteTally, getMafiaTeamActions } from "./actions";
import { checkWinConditions } from "./phase";

export async function createGame(
  db: D1Database,
  hostNickname?: string,
  _characterId?: string
): Promise<{
  success: boolean;
  gameCode?: string;
  hostToken?: string;
  token?: string;
  error?: string;
}> {
  const effectiveHostNickname = hostNickname?.trim() || "MG";

  if (!effectiveHostNickname) {
    return { success: false, error: "Nazwa MG nie może być pusta" };
  }

  const gameId = nanoid();
  const gameCode = generateSessionCode();
  const hostPlayerId = nanoid();
  const hostToken = nanoid();

  try {
    await db.batch([
      db
        .prepare(
          "INSERT INTO games (id, code, host_player_id, status, phase, phase_deadline, round, winner, config, created_at) VALUES (?, ?, ?, 'lobby', 'lobby', NULL, 0, NULL, '{}', ?)"
        )
        .bind(gameId, gameCode, hostPlayerId, now()),
      db
        .prepare(
          "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host) VALUES (?, ?, ?, ?, NULL, 1, 1)"
        )
        .bind(gameId, hostPlayerId, hostToken, effectiveHostNickname),
    ]);

    return { success: true, gameCode, hostToken, token: hostToken };
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return { success: false, error: "Kod gry już istnieje, spróbuj ponownie" };
    }
    throw error;
  }
}

export async function joinGame(
  db: D1Database,
  gameCode: string,
  playerNickname?: string,
  _characterId?: string
): Promise<{ success: boolean; playerToken?: string; token?: string; error?: string }> {
  const effectivePlayerNickname = playerNickname?.trim() || "Player";

  if (!gameCode.trim() || !effectivePlayerNickname) {
    return { success: false, error: "Kod gry i nick nie mogą być puste" };
  }

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE code = ?")
    .bind(gameCode.trim().toUpperCase())
    .first<GameRow>();

  if (!gameRow) return null;
  if (gameRow.status !== "lobby") return null;

  const playerId = nanoid();
  const playerToken = nanoid();

  try {
    await db
      .prepare(
        "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host) VALUES (?, ?, ?, ?, NULL, 1, 0)"
      )
      .bind(gameRow.id, playerId, playerToken, effectivePlayerNickname)
      .run();

    return { success: true, playerToken, token: playerToken };
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { success: false, error: "Gracz o takim nicku już istnieje w tej grze" };
    }
    throw error;
  }
}

export async function getGameState(
  db: D1Database,
  token: string
): Promise<GameStateResponse | null> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return null;

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return null;

  // Get all players
  const { results: allPlayers } = await db
    .prepare("SELECT * FROM game_players WHERE game_id = ? ORDER BY is_host DESC, nickname ASC")
    .bind(playerRow.game_id)
    .all<GamePlayerRow>();

  // Get all characters
  const { results: allCharacters } = await db
    .prepare("SELECT * FROM characters WHERE is_active = 1 ORDER BY sort_order ASC")
    .bind()
    .all<CharacterRow>();

  const isHost = playerRow.is_host === 1;

  // Build public players list
  const players: PublicPlayer[] = allPlayers
    .filter((p) => !p.is_host)
    .map((p) => {
      const character = allCharacters.find((c) => c.id === p.character_id);
      return {
        playerId: p.player_id,
        nickname: p.nickname,
        isAlive: p.is_alive === 1,
        isHost: false,
        role: gameRow.status === "playing" ? (p.role as any) : null,
        isYou: p.player_id === playerRow.player_id,
        character: character
          ? {
              id: character.id,
              slug: character.slug,
              namePl: character.name_pl,
              avatarUrl: character.avatar_url,
            }
          : null,
      };
    });

  // Get messages for current player
  const { results: messages } = await db
    .prepare(
      "SELECT id, content, created_at FROM messages WHERE game_id = ? AND to_player_id = ? ORDER BY created_at DESC LIMIT 10"
    )
    .bind(playerRow.game_id, playerRow.player_id)
    .all<{ id: string; content: string; created_at: string }>();

  // Get missions for current player
  const { results: missions } = await db
    .prepare("SELECT * FROM missions WHERE game_id = ? AND player_id = ? ORDER BY created_at DESC")
    .bind(playerRow.game_id, playerRow.player_id)
    .all<{
      id: string;
      description: string;
      is_secret: number;
      is_completed: number;
      points: number;
    }>();

  // Get detective result (if player is detective)
  let detectiveResult = null;
  if (playerRow.role === "detective" && gameRow.status === "playing") {
    const { results: investigations } = await db
      .prepare(
        `SELECT ga.target_player_id, gp.nickname, gp.role
         FROM game_actions ga
         JOIN game_players gp ON ga.target_player_id = gp.player_id
         WHERE ga.game_id = ? AND ga.player_id = ? AND ga.action_type = 'investigate'
         ORDER BY ga.created_at DESC
         LIMIT 1`
      )
      .bind(gameRow.id, playerRow.player_id)
      .all<{ target_player_id: string; nickname: string; role: string }>();

    if (investigations.length > 0) {
      const investigation = investigations[0];
      detectiveResult = {
        targetNickname: investigation.nickname,
        isMafia: investigation.role === "mafia",
        round: gameRow.round,
      };
    }
  }

  // Get current player's action in this round
  let myAction = null;
  if (gameRow.status === "playing") {
    const { results: actions } = await db
      .prepare(
        "SELECT action_type, target_player_id FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ?"
      )
      .bind(gameRow.id, playerRow.player_id, gameRow.round, gameRow.phase)
      .all<{ action_type: string; target_player_id: string | null }>();

    if (actions.length > 0) {
      myAction = {
        actionType: actions[0].action_type,
        targetPlayerId: actions[0].target_player_id,
      };
    }
  }

  // Get phase progress (host only)
  const phaseProgress =
    isHost && gameRow.status === "playing"
      ? await getPhaseProgress(db, gameRow, allPlayers)
      : undefined;

  // Get current player's character
  const playerCharacter = allCharacters.find((c) => c.id === playerRow.character_id);

  const takenCharacterIds = allPlayers.filter((p) => p.character_id).map((p) => p.character_id!);

  // Get mafia team actions (mafia only)
  const mafiaTeamActions = await getMafiaTeamActions(db, playerRow, gameRow, allPlayers);

  // Get vote tally (visible during voting phase)
  const voteTally =
    gameRow.phase === "voting" ? await getVoteTally(db, gameRow, allPlayers) : undefined;

  // Host-only data
  let hostActions = undefined;
  let hostMissions = undefined;

  if (isHost) {
    // Get all actions in current round/phase
    const { results: allActions } = await db
      .prepare(
        `SELECT ga.player_id, ga.action_type, ga.target_player_id, gp.nickname,
                target_gp.nickname as target_nickname
         FROM game_actions ga
         JOIN game_players gp ON ga.player_id = gp.player_id
         LEFT JOIN game_players target_gp ON ga.target_player_id = target_gp.player_id
         WHERE ga.game_id = ? AND ga.round = ? AND ga.phase = ?`
      )
      .bind(gameRow.id, gameRow.round, gameRow.phase)
      .all<{
        player_id: string;
        action_type: string;
        target_player_id: string | null;
        nickname: string;
        target_nickname: string | null;
      }>();

    hostActions = allActions.map((action) => ({
      playerId: action.player_id,
      nickname: action.nickname,
      actionType: action.action_type,
      targetPlayerId: action.target_player_id,
      targetNickname: action.target_nickname,
    }));

    // Get all missions
    const { results: allMissions } = await db
      .prepare(
        `SELECT m.*, gp.nickname as player_nickname
         FROM missions m
         JOIN game_players gp ON m.player_id = gp.player_id
         WHERE m.game_id = ?
         ORDER BY m.created_at DESC`
      )
      .bind(gameRow.id)
      .all<{
        id: string;
        player_id: string;
        player_nickname: string;
        description: string;
        is_secret: number;
        is_completed: number;
        points: number;
      }>();

    hostMissions = allMissions.map((mission) => ({
      id: mission.id,
      playerId: mission.player_id,
      playerNickname: mission.player_nickname,
      description: mission.description,
      isSecret: mission.is_secret === 1,
      isCompleted: mission.is_completed === 1,
      points: mission.points,
    }));
  }

  const showPoints = gameRow.phase === "review" || gameRow.status === "finished";

  return {
    game: {
      id: gameRow.id,
      code: gameRow.code,
      status: gameRow.status as any,
      phase: gameRow.phase as any,
      round: gameRow.round,
      winner: gameRow.winner,
    },
    currentPlayer: {
      playerId: playerRow.player_id,
      nickname: playerRow.nickname,
      token: playerRow.token,
      role: playerRow.role as any,
      isAlive: playerRow.is_alive === 1,
      isHost: playerRow.is_host === 1,
      isSetupComplete: !!playerRow.character_id,
      character: playerCharacter
        ? {
            id: playerCharacter.id,
            slug: playerCharacter.slug,
            namePl: playerCharacter.name_pl,
            avatarUrl: playerCharacter.avatar_url,
          }
        : null,
    },
    takenCharacterIds,
    players,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.created_at,
    })),
    missions: missions.map((m) => ({
      id: m.id,
      description: m.description,
      isSecret: m.is_secret === 1,
      isCompleted: m.is_completed === 1,
      points: m.points,
    })),
    detectiveResult,
    myAction,
    mafiaTeamActions,
    voteTally,
    hostActions,
    hostMissions,
    phaseProgress,
    showPoints,
  };
}

export async function rematch(
  db: D1Database,
  token: string,
  _mafiaCount?: number,
  _mode?: "full" | "simple"
): Promise<{ success: boolean; gameCode?: string; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może rozpocząć rewanż" };

  const currentGameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!currentGameRow) return { success: false, error: "Gra nie istnieje" };

  const newGameId = nanoid();
  const newGameCode = generateSessionCode();

  try {
    // Get current game players
    const { results: currentPlayers } = await db
      .prepare("SELECT player_id, nickname, is_host FROM game_players WHERE game_id = ?")
      .bind(playerRow.game_id)
      .all<{ player_id: string; nickname: string; is_host: number }>();

    // Create new game
    await db
      .prepare(
        "INSERT INTO games (id, code, host_player_id, status, phase, phase_deadline, round, winner, config, created_at) VALUES (?, ?, ?, 'lobby', 'lobby', NULL, 0, NULL, ?, ?)"
      )
      .bind(newGameId, newGameCode, playerRow.player_id, currentGameRow.config, now())
      .run();

    // Copy players to new game
    const playerInserts = currentPlayers.map((p) =>
      db
        .prepare(
          "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host) VALUES (?, ?, ?, ?, NULL, 1, ?)"
        )
        .bind(newGameId, p.player_id, nanoid(), p.nickname, p.is_host)
    );

    await db.batch(playerInserts);

    return { success: true, gameCode: newGameCode };
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return { success: false, error: "Kod gry już istnieje, spróbuj ponownie" };
    }
    throw error;
  }
}

export async function finalizeGame(
  db: D1Database,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może finalizować grę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.phase !== "review")
    return { success: false, error: "Gra nie jest w fazie przeglądu misji" };

  const winner = await checkWinConditions(db, playerRow.game_id);

  await db
    .prepare("UPDATE games SET status = 'finished', phase = 'ended', winner = ? WHERE id = ?")
    .bind(winner, playerRow.game_id)
    .run();

  return { success: true };
}

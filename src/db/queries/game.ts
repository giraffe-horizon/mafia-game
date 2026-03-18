import type {
  D1Database,
  GameRow,
  GamePlayerRow,
  GameStateResponse,
  GameStatus,
  GamePhase,
  Role,
  PublicPlayer,
} from "@/db/types";
import { generateSessionCode, now, nanoid } from "@/db/helpers";
import { getPhaseProgress, getVoteTally, getMafiaTeamActions } from "./actions";
import { checkWinConditions } from "./phase";

export async function createGame(
  db: D1Database,
  hostNickname?: string,
  characterId?: string
): Promise<{
  success: boolean;
  gameCode?: string;
  hostToken?: string;
  token?: string;
  error?: string;
}> {
  const effectiveHostNickname = hostNickname?.trim() || "Mistrz Gry";

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
          "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host, character_id) VALUES (?, ?, ?, ?, NULL, 1, 1, ?)"
        )
        .bind(gameId, hostPlayerId, hostToken, effectiveHostNickname, characterId || null),
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
  characterId?: string
): Promise<{ success: boolean; playerToken?: string; token?: string; error?: string } | null> {
  const effectivePlayerNickname = playerNickname?.trim() || "";

  if (!gameCode.trim()) {
    return { success: false, error: "Kod gry nie może być pusty" };
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
        "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host, character_id) VALUES (?, ?, ?, ?, NULL, 1, 0, ?)"
      )
      .bind(gameRow.id, playerId, playerToken, effectivePlayerNickname, characterId || null)
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
    .prepare(
      `SELECT gp.*, c.id as character_id_data, c.slug as character_slug, c.name_pl as character_name_pl, c.avatar_url as character_avatar_url
       FROM game_players gp
       LEFT JOIN characters c ON gp.character_id = c.id
       WHERE gp.token = ?`
    )
    .bind(token)
    .first<
      GamePlayerRow & {
        character_id_data: string | null;
        character_slug: string | null;
        character_name_pl: string | null;
        character_avatar_url: string | null;
      }
    >();

  if (!playerRow) return null;

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return null;

  // Get all players with character data
  const { results: allPlayers } = await db
    .prepare(
      `SELECT gp.*, c.id as character_id_data, c.slug as character_slug, c.name_pl as character_name_pl, c.avatar_url as character_avatar_url
       FROM game_players gp
       LEFT JOIN characters c ON gp.character_id = c.id
       WHERE gp.game_id = ?
       ORDER BY gp.is_host DESC, gp.nickname ASC`
    )
    .bind(playerRow.game_id)
    .all<
      GamePlayerRow & {
        character_id_data: string | null;
        character_slug: string | null;
        character_name_pl: string | null;
        character_avatar_url: string | null;
      }
    >();

  const isHost = playerRow.is_host === 1;

  // Build public players list (include ALL players including host)
  const players: PublicPlayer[] = allPlayers.map((p) => {
    return {
      playerId: p.player_id,
      nickname: p.nickname,
      isAlive: p.is_alive === 1,
      isHost: p.is_host === 1,
      role: (() => {
        if (gameRow.status === "finished") return p.role as Role | null;
        if (gameRow.status !== "playing") return null;
        if (p.token === token) return p.role as Role | null; // own role
        if (isHost) return p.role as Role | null; // GM sees all
        if (p.is_alive === 0) return p.role as Role | null; // dead players revealed
        if (playerRow.role === "mafia" && p.role === "mafia") return p.role as Role | null; // mafia sees teammates
        return null;
      })(),
      isYou: p.token === token, // Use token comparison like original
      character: p.character_id_data
        ? {
            id: p.character_id_data,
            slug: p.character_slug!,
            namePl: p.character_name_pl!,
            avatarUrl: p.character_avatar_url!,
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

  // Get detective result and all investigated players (if player is detective)
  let detectiveResult = null;
  let investigatedPlayers: { playerId: string; isMafia: boolean }[] | undefined = undefined;
  if (playerRow.role === "detective" && gameRow.status === "playing") {
    const { results: investigations } = await db
      .prepare(
        `SELECT ga.target_player_id, gp.nickname, gp.role
         FROM game_actions ga
         JOIN game_players gp ON ga.target_player_id = gp.player_id
         WHERE ga.game_id = ? AND ga.player_id = ? AND ga.action_type = 'investigate'
         ORDER BY ga.created_at DESC`
      )
      .bind(gameRow.id, playerRow.player_id)
      .all<{ target_player_id: string; nickname: string; role: string }>();

    if (investigations.length > 0) {
      const latest = investigations[0];
      detectiveResult = {
        targetNickname: latest.nickname,
        isMafia: latest.role === "mafia",
        round: gameRow.round,
      };

      investigatedPlayers = investigations.map((inv) => ({
        playerId: inv.target_player_id,
        isMafia: inv.role === "mafia",
      }));
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

  const takenCharacterIds = allPlayers
    .filter((p) => p.character_id_data != null)
    .map((p) => p.character_id_data!);

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

  // Parse lobby settings from config
  let lobbySettings: { mode: "full" | "simple"; mafiaCount: number } | undefined;
  try {
    const config = JSON.parse(gameRow.config || "{}");
    if (config.mode) {
      lobbySettings = {
        mode: config.mode === "simple" ? "simple" : "full",
        mafiaCount: typeof config.mafiaCount === "number" ? config.mafiaCount : 0,
      };
    }
  } catch {
    // ignore malformed config
  }

  return {
    game: {
      id: gameRow.id,
      code: gameRow.code,
      status: gameRow.status as GameStatus,
      phase: gameRow.phase as GamePhase,
      round: gameRow.round,
      winner: gameRow.winner,
    },
    currentPlayer: {
      playerId: playerRow.player_id,
      nickname: playerRow.nickname,
      token: playerRow.token,
      role: playerRow.role as Role | null,
      isAlive: playerRow.is_alive === 1,
      isHost: playerRow.is_host === 1,
      isSetupComplete: !!playerRow.nickname,
      character: playerRow.character_id_data
        ? {
            id: playerRow.character_id_data,
            slug: playerRow.character_slug!,
            namePl: playerRow.character_name_pl!,
            avatarUrl: playerRow.character_avatar_url!,
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
    investigatedPlayers,
    detectiveResult,
    myAction,
    mafiaTeamActions,
    voteTally,
    hostActions,
    hostMissions,
    phaseProgress,
    lobbySettings,
    showPoints,
  };
}

export async function rematch(
  db: D1Database,
  token: string,
  _mafiaCount?: number,
  _mode?: "full" | "simple"
): Promise<{ success: boolean; error?: string }> {
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
  if (currentGameRow.status !== "finished")
    return { success: false, error: "Gra nie jest jeszcze zakończona" };

  // Reset game to lobby in-place — tokens stay the same, round preserved for multi-round tracking
  await db.batch([
    db
      .prepare(
        "UPDATE games SET status = 'lobby', phase = 'lobby', winner = NULL, phase_deadline = NULL WHERE id = ?"
      )
      .bind(currentGameRow.id),
    db
      .prepare("UPDATE game_players SET role = NULL, is_alive = 1 WHERE game_id = ?")
      .bind(currentGameRow.id),
    db.prepare("DELETE FROM game_actions WHERE game_id = ?").bind(currentGameRow.id),
    db.prepare("DELETE FROM messages WHERE game_id = ?").bind(currentGameRow.id),
    db.prepare("DELETE FROM missions WHERE game_id = ?").bind(currentGameRow.id),
  ]);

  return { success: true };
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

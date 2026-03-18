import { nanoid } from "nanoid";
import type {
  D1Database,
  D1PreparedStatement,
  GameRow,
  GamePlayerRow,
  MessageRow,
  GameActionRow,
  MissionRow,
  CharacterRow,
  GameStatus,
  GamePhase,
  Role,
  PublicPlayer,
  GameStateResponse,
} from "@/db/types";

// Re-export types for backwards compatibility
export type {
  D1Database,
  D1PreparedStatement,
  GameRow,
  GamePlayerRow,
  MessageRow,
  GameActionRow,
  MissionRow,
  CharacterRow,
  GameStatus,
  GamePhase,
  Role,
  PublicPlayer,
  GameStateResponse,
} from "@/db/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateSessionCode(): string {
  // 6 chars, easy to read/type: no 0/O, no 1/I/L, no 5/S, no 8/B
  const chars = "ACDEFGHJKMNPQRTUVWXY234679";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function now(): string {
  return new Date().toISOString();
}

async function getMafiaKillActions(
  db: D1Database,
  gameId: string,
  round: number
): Promise<{
  aliveMafia: { player_id: string }[];
  killActions: { player_id: string; target_player_id: string }[];
}> {
  const { results: aliveMafia } = await db
    .prepare(
      "SELECT player_id FROM game_players WHERE game_id = ? AND role = 'mafia' AND is_alive = 1"
    )
    .bind(gameId)
    .all<{ player_id: string }>();

  const { results: killActions } = await db
    .prepare(
      "SELECT player_id, target_player_id FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'night' AND action_type = 'kill'"
    )
    .bind(gameId, round)
    .all<{ player_id: string; target_player_id: string }>();

  return { aliveMafia, killActions };
}

async function getPhaseProgress(
  db: D1Database,
  gameRow: GameRow,
  allPlayers: GamePlayerRow[]
): Promise<GameStateResponse["phaseProgress"]> {
  const { phase, round } = gameRow;

  // Only return progress for specific phases during gameplay
  if (gameRow.status !== "playing") return undefined;
  if (phase === "review" || phase === "lobby" || phase === "ended") return undefined;

  const alivePlayers = allPlayers.filter((p) => p.is_alive === 1);
  const aliveNonHost = alivePlayers.filter((p) => p.is_host === 0);

  if (phase === "day") {
    return {
      phase,
      requiredActions: [],
      allDone: true,
      hint: "Czas na dyskusję. Przejdź do głosowania gdy gracze są gotowi.",
      mafiaUnanimous: true, // Not applicable during day
    };
  }

  // Get actions for current phase/round
  const { results: actions } = await db
    .prepare("SELECT player_id FROM game_actions WHERE game_id = ? AND round = ? AND phase = ?")
    .bind(gameRow.id, round, phase)
    .all<{ player_id: string }>();

  const actedPlayerIds = new Set(actions.map((a) => a.player_id));

  if (phase === "night") {
    // Required: mafia (kill), detective (investigate), doctor (protect)
    const requiredRoles = ["mafia", "detective", "doctor"];
    const requiredActions = aliveNonHost
      .filter((p) => requiredRoles.includes(p.role!))
      .map((p) => ({
        playerId: p.player_id,
        nickname: p.nickname,
        role: p.role!,
        done: actedPlayerIds.has(p.player_id),
      }));

    const missingRoles = requiredActions.filter((a) => !a.done).map((a) => a.role);

    // Check mafia consensus
    const { aliveMafia, killActions } = await getMafiaKillActions(db, gameRow.id, round);

    let mafiaUnanimous: boolean;
    let hasConsensusIssue = false;

    if (aliveMafia.length > 1) {
      const mafiaPlayerIds = new Set(aliveMafia.map((m) => m.player_id));
      const mafiaKillActions = killActions.filter((action) => mafiaPlayerIds.has(action.player_id));

      if (mafiaKillActions.length > 0) {
        const targets = [...new Set(mafiaKillActions.map((action) => action.target_player_id))];
        const allMafiaVoted = mafiaKillActions.length === aliveMafia.length;
        const unanimous = targets.length === 1 && allMafiaVoted;

        mafiaUnanimous = unanimous;
        hasConsensusIssue = targets.length > 1;

        if (!allMafiaVoted) {
          mafiaUnanimous = false;
        }
      } else {
        // No votes yet, not unanimous
        mafiaUnanimous = false;
      }
    } else if (aliveMafia.length === 1) {
      // Single mafia member, unanimous if they voted
      mafiaUnanimous = killActions.length > 0;
    } else {
      // No mafia alive, considered unanimous
      mafiaUnanimous = true;
    }

    const allDone = missingRoles.length === 0 && mafiaUnanimous;
    const baseHint = allDone
      ? "Wszystkie akcje złożone! Przejdź do dnia."
      : `Czekaj na akcje nocne. Brakuje: ${missingRoles.join(", ")}.`;

    const hint = baseHint + (hasConsensusIssue ? " ⚠️ Mafia nie jest zgodna!" : "");

    return {
      phase,
      requiredActions,
      allDone,
      hint,
      mafiaUnanimous,
    };
  }

  if (phase === "voting") {
    // Required: ALL alive non-host players
    const requiredActions = aliveNonHost.map((p) => ({
      playerId: p.player_id,
      nickname: p.nickname,
      role: p.role!,
      done: actedPlayerIds.has(p.player_id),
    }));

    const votedCount = requiredActions.filter((a) => a.done).length;
    const totalVoters = requiredActions.length;
    const allDone = votedCount === totalVoters;

    const hint = allDone
      ? "Wszyscy zagłosowali! Ogłoś wynik."
      : `Trwa głosowanie. ${votedCount}/${totalVoters} głosów.`;

    return {
      phase,
      requiredActions,
      allDone,
      hint,
      mafiaUnanimous: true, // Not applicable during voting
    };
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// createGame
// ---------------------------------------------------------------------------
export async function createGame(
  db: D1Database,
  hostNickname?: string,
  characterId?: string
): Promise<{ token: string }> {
  const gameId = nanoid();
  const hostPlayerId = nanoid();
  const hostToken = nanoid();

  let code = generateSessionCode();
  while (await db.prepare("SELECT id FROM games WHERE code = ?").bind(code).first()) {
    code = generateSessionCode();
  }

  await db.batch([
    db
      .prepare(
        "INSERT INTO games (id, code, host_player_id, status, phase, round, winner, config, created_at) VALUES (?, ?, ?, 'lobby', 'lobby', 0, NULL, '{}', ?)"
      )
      .bind(gameId, code, hostPlayerId, now()),
    db
      .prepare(
        "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host, character_id) VALUES (?, ?, ?, ?, NULL, 1, 1, ?)"
      )
      .bind(
        gameId,
        hostPlayerId,
        hostToken,
        hostNickname?.trim() || "Mistrz Gry",
        characterId || null
      ),
  ]);

  return { token: hostToken };
}

// ---------------------------------------------------------------------------
// joinGame
// ---------------------------------------------------------------------------
export async function joinGame(
  db: D1Database,
  code: string,
  nickname?: string,
  characterId?: string
): Promise<{ token: string } | null> {
  const normalizedCode = code.toUpperCase().trim();
  const game = await db
    .prepare("SELECT id, status FROM games WHERE code = ?")
    .bind(normalizedCode)
    .first<{ id: string; status: string }>();

  if (!game || game.status !== "lobby") return null;

  const playerId = nanoid();
  const token = nanoid();

  await db
    .prepare(
      "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host, character_id) VALUES (?, ?, ?, ?, NULL, 1, 0, ?)"
    )
    .bind(game.id, playerId, token, nickname?.trim() || "", characterId || null)
    .run();

  return { token };
}

// ---------------------------------------------------------------------------
// setupPlayer
// ---------------------------------------------------------------------------
export async function setupPlayer(
  db: D1Database,
  token: string,
  nickname: string,
  characterId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate nickname length
  if (!nickname.trim() || nickname.trim().length < 1 || nickname.trim().length > 20) {
    return { success: false, error: "Nazwa musi mieć 1-20 znaków" };
  }

  // Get player's game info
  const playerRow = await db
    .prepare("SELECT game_id, player_id FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string; player_id: string }>();

  if (!playerRow) {
    return { success: false, error: "Nieprawidłowy token gracza" };
  }

  // Check if nickname is unique in this game
  const existingNickname = await db
    .prepare(
      "SELECT player_id FROM game_players WHERE game_id = ? AND nickname = ? AND player_id != ?"
    )
    .bind(playerRow.game_id, nickname.trim(), playerRow.player_id)
    .first();

  if (existingNickname) {
    return { success: false, error: "Ta nazwa jest już zajęta" };
  }

  // Validate character exists and is active
  const character = await db
    .prepare("SELECT id FROM characters WHERE id = ? AND is_active = 1")
    .bind(characterId)
    .first<{ id: string }>();

  if (!character) {
    return { success: false, error: "Nieprawidłowa postać" };
  }

  // Check if character is not taken in this game
  const existingCharacter = await db
    .prepare(
      "SELECT player_id FROM game_players WHERE game_id = ? AND character_id = ? AND player_id != ?"
    )
    .bind(playerRow.game_id, characterId, playerRow.player_id)
    .first();

  if (existingCharacter) {
    return { success: false, error: "Ta postać jest już wybrana" };
  }

  // Update player
  await db
    .prepare("UPDATE game_players SET nickname = ?, character_id = ? WHERE token = ?")
    .bind(nickname.trim(), characterId, token)
    .run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// getGameState
// ---------------------------------------------------------------------------
export async function getGameState(
  db: D1Database,
  token: string
): Promise<GameStateResponse | null> {
  const playerRow = await db
    .prepare(
      `
      SELECT gp.*, c.id as character_id, c.slug as character_slug, c.name_pl as character_name_pl, c.avatar_url as character_avatar_url
      FROM game_players gp
      LEFT JOIN characters c ON gp.character_id = c.id
      WHERE gp.token = ?
    `
    )
    .bind(token)
    .first<
      GamePlayerRow & {
        character_id: string | null;
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

  const { results: allPlayers } = await db
    .prepare(
      `
      SELECT gp.*, c.id as character_id, c.slug as character_slug, c.name_pl as character_name_pl, c.avatar_url as character_avatar_url
      FROM game_players gp
      LEFT JOIN characters c ON gp.character_id = c.id
      WHERE gp.game_id = ?
      ORDER BY gp.is_host DESC, gp.nickname ASC
    `
    )
    .bind(playerRow.game_id)
    .all<
      GamePlayerRow & {
        character_id: string | null;
        character_slug: string | null;
        character_name_pl: string | null;
        character_avatar_url: string | null;
      }
    >();

  // Get messages:
  //   - Broadcast (to_player_id IS NULL): all recent ones — never mark as read globally
  //     so every player gets them. Client deduplicates via shownMessageIds ref.
  //   - Private (to_player_id = me): only unread ones
  const { results: messages } = await db
    .prepare(
      `SELECT * FROM messages
       WHERE game_id = ? AND (from_player_id IS NULL OR from_player_id != ?)
         AND (
           (to_player_id IS NULL)
           OR (to_player_id = ? AND is_read = 0)
         )
       ORDER BY created_at ASC`
    )
    .bind(playerRow.game_id, playerRow.player_id, playerRow.player_id)
    .all<MessageRow>();

  // Mark only private (targeted) messages as read
  const privateUnread = messages.filter(
    (m) => m.to_player_id === playerRow.player_id && m.is_read === 0
  );
  if (privateUnread.length > 0) {
    await db.batch(
      privateUnread.map((m) =>
        db.prepare("UPDATE messages SET is_read = 1 WHERE id = ?").bind(m.id)
      )
    );
  }

  // Get all missions for this player (including completed so player can see status)
  const { results: missionRows } = await db
    .prepare("SELECT * FROM missions WHERE game_id = ? AND player_id = ? ORDER BY created_at ASC")
    .bind(playerRow.game_id, playerRow.player_id)
    .all<MissionRow>();

  // Detective result — most recent investigate action with resolved data
  let detectiveResult: GameStateResponse["detectiveResult"] = null;
  if (playerRow.role === "detective") {
    const action = await db
      .prepare(
        "SELECT data FROM game_actions WHERE game_id = ? AND player_id = ? AND action_type = 'investigate' AND data != '{}' ORDER BY created_at DESC LIMIT 1"
      )
      .bind(playerRow.game_id, playerRow.player_id)
      .first<{ data: string }>();
    if (action?.data) {
      try {
        detectiveResult = JSON.parse(action.data);
      } catch {
        // ignore
      }
    }
  }

  // Has this player already acted in the current phase?
  const existingAction = await db
    .prepare(
      "SELECT action_type, target_player_id FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ? LIMIT 1"
    )
    .bind(playerRow.game_id, playerRow.player_id, gameRow.round, gameRow.phase)
    .first<{ action_type: string; target_player_id: string | null }>();

  const isHost = playerRow.is_host === 1;

  // For host: fetch all actions in current round/phase to display in real-time
  let hostActions: GameStateResponse["hostActions"] = undefined;
  if (isHost && gameRow.status === "playing") {
    const { results: actionRows } = await db
      .prepare(
        "SELECT ga.player_id, gp.nickname, ga.action_type, ga.target_player_id FROM game_actions ga JOIN game_players gp ON gp.game_id = ga.game_id AND gp.player_id = ga.player_id WHERE ga.game_id = ? AND ga.round = ? AND ga.phase = ? ORDER BY ga.created_at ASC"
      )
      .bind(playerRow.game_id, gameRow.round, gameRow.phase)
      .all<{
        player_id: string;
        nickname: string;
        action_type: string;
        target_player_id: string | null;
      }>();

    // Build nickname lookup for targets
    const playerNicknameMap = new Map(allPlayers.map((p) => [p.player_id, p.nickname]));

    hostActions = actionRows.map((a) => ({
      playerId: a.player_id,
      nickname: a.nickname,
      actionType: a.action_type,
      targetPlayerId: a.target_player_id,
      targetNickname: a.target_player_id
        ? (playerNicknameMap.get(a.target_player_id) ?? null)
        : null,
    }));
  }

  // For host: fetch all missions in the game with player nicknames
  let hostMissions: GameStateResponse["hostMissions"] = undefined;
  if (isHost) {
    const { results: allMissions } = await db
      .prepare(
        "SELECT m.id, m.player_id, m.description, m.is_secret, m.is_completed, m.points, gp.nickname FROM missions m JOIN game_players gp ON gp.game_id = m.game_id AND gp.player_id = m.player_id WHERE m.game_id = ? ORDER BY m.created_at ASC"
      )
      .bind(playerRow.game_id)
      .all<{
        id: string;
        player_id: string;
        description: string;
        is_secret: number;
        is_completed: number;
        points: number;
        nickname: string;
      }>();
    hostMissions = allMissions.map((m) => ({
      id: m.id,
      playerId: m.player_id,
      playerNickname: m.nickname,
      description: m.description,
      isSecret: m.is_secret === 1,
      isCompleted: m.is_completed === 1,
      points: m.points,
    }));
  }

  // For host: get phase progress during game
  const phaseProgress =
    isHost && gameRow.status === "playing"
      ? await getPhaseProgress(db, gameRow, allPlayers)
      : undefined;

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
      isHost,
      isSetupComplete: !!playerRow.nickname,
      character: playerRow.character_id
        ? {
            id: playerRow.character_id,
            slug: playerRow.character_slug!,
            namePl: playerRow.character_name_pl!,
            avatarUrl: playerRow.character_avatar_url!,
          }
        : null,
    },
    takenCharacterIds: allPlayers.filter((p) => p.character_id != null).map((p) => p.character_id!),
    players: allPlayers.map((p) => ({
      playerId: p.player_id,
      nickname: p.nickname,
      isAlive: p.is_alive === 1,
      isHost: p.is_host === 1,
      // Host sees all roles; player sees own role during game; mafia sees teammates;
      // dead players see all roles; roles visible to all when finished
      role:
        isHost ||
        gameRow.status === "finished" ||
        (gameRow.status === "playing" && p.token === token) ||
        (gameRow.status === "playing" && playerRow.role === "mafia" && p.role === "mafia") ||
        (gameRow.status === "playing" && !playerRow.is_alive)
          ? (p.role as Role | null)
          : null,
      isYou: p.token === token,
      character: p.character_id
        ? {
            id: p.character_id,
            slug: p.character_slug!,
            namePl: p.character_name_pl!,
            avatarUrl: p.character_avatar_url!,
          }
        : null,
    })),
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.created_at,
    })),
    missions: missionRows.map((m) => ({
      id: m.id,
      description: m.description,
      isSecret: m.is_secret === 1,
      isCompleted: m.is_completed === 1,
      points: m.points,
    })),
    detectiveResult,
    myAction: existingAction
      ? {
          actionType: existingAction.action_type,
          targetPlayerId: existingAction.target_player_id,
        }
      : null,
    mafiaTeamActions: await getMafiaTeamActions(db, playerRow, gameRow, allPlayers),
    voteTally: await getVoteTally(db, gameRow, allPlayers),
    hostActions,
    hostMissions,
    phaseProgress,
    showPoints: gameRow.phase === "review" || gameRow.status === "finished",
  };
}

async function getVoteTally(
  db: D1Database,
  gameRow: GameRow,
  allPlayers: GamePlayerRow[]
): Promise<GameStateResponse["voteTally"]> {
  if (gameRow.phase !== "voting") return undefined;

  const aliveNonHost = allPlayers.filter((p) => p.is_alive && !p.is_host);
  const totalVoters = aliveNonHost.length;

  const { results: votes } = await db
    .prepare(
      "SELECT target_player_id, COUNT(*) as vote_count FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'voting' AND action_type = 'vote' AND target_player_id IS NOT NULL GROUP BY target_player_id ORDER BY vote_count DESC"
    )
    .bind(gameRow.id, gameRow.round)
    .all<{ target_player_id: string; vote_count: number }>();

  const votedCount = votes.reduce((sum, v) => sum + v.vote_count, 0);

  return {
    totalVoters,
    votedCount,
    results: votes.map((v) => ({
      playerId: v.target_player_id,
      nickname: allPlayers.find((p) => p.player_id === v.target_player_id)?.nickname ?? "?",
      votes: v.vote_count,
    })),
  };
}

async function getMafiaTeamActions(
  db: D1Database,
  playerRow: GamePlayerRow,
  gameRow: GameRow,
  allPlayers: GamePlayerRow[]
): Promise<GameStateResponse["mafiaTeamActions"]> {
  // Only show to mafia members during night or voting
  if (playerRow.role !== "mafia") return undefined;
  if (gameRow.phase !== "night" && gameRow.phase !== "voting") return undefined;

  const { results } = await db
    .prepare(
      "SELECT gp.player_id, gp.nickname, ga.target_player_id FROM game_players gp LEFT JOIN game_actions ga ON ga.game_id = gp.game_id AND ga.player_id = gp.player_id AND ga.round = ? AND ga.phase = ? AND ga.action_type = 'kill' WHERE gp.game_id = ? AND gp.role = 'mafia' AND gp.is_alive = 1 ORDER BY gp.nickname ASC"
    )
    .bind(gameRow.round, gameRow.phase, gameRow.id)
    .all<{ player_id: string; nickname: string; target_player_id: string | null }>();

  return results.map((r) => ({
    nickname: r.nickname,
    targetPlayerId: r.target_player_id,
    targetNickname: r.target_player_id
      ? (allPlayers.find((p) => p.player_id === r.target_player_id)?.nickname ?? null)
      : null,
  }));
}

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------
// Default mafia proportions:
// 4-5 players: 1 mafia, 6-8: 2 mafia, 9-11: 3 mafia, 12+: 4 mafia
// Always: 1 detective, 1 doctor, rest civilians
// mode: "full" = mafia + detective + doctor + civilians (min 4 players)
//       "simple" = mafia + civilians only (min 2 players, no special roles)
function buildRoles(
  n: number,
  customMafiaCount?: number,
  mode: "full" | "simple" = "full"
): Role[] {
  let mafiaCount: number;

  if (mode === "simple") {
    // Simple mode: just mafia vs civilians, no special roles
    if (customMafiaCount !== undefined && customMafiaCount >= 1 && customMafiaCount <= n - 1) {
      mafiaCount = customMafiaCount;
    } else {
      mafiaCount = Math.max(1, Math.floor(n / 3));
    }
    return [
      ...Array<Role>(mafiaCount).fill("mafia"),
      ...Array<Role>(n - mafiaCount).fill("civilian"),
    ];
  }

  // Full mode: mafia + detective + doctor + civilians
  if (customMafiaCount !== undefined && customMafiaCount >= 1 && customMafiaCount <= n - 3) {
    mafiaCount = customMafiaCount;
  } else {
    if (n <= 5) mafiaCount = 1;
    else if (n <= 8) mafiaCount = 2;
    else if (n <= 11) mafiaCount = 3;
    else mafiaCount = 4;
  }
  return [
    ...Array<Role>(mafiaCount).fill("mafia"),
    "detective",
    "doctor",
    ...Array<Role>(Math.max(0, n - mafiaCount - 2)).fill("civilian"),
  ];
}

export async function startGame(
  db: D1Database,
  token: string,
  customMafiaCount?: number,
  mode: "full" | "simple" = "full"
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może startować grę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.status !== "lobby") return { success: false, error: "Gra już trwa" };

  // Only non-host players get roles
  const { results: players } = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ? AND is_host = 0")
    .bind(playerRow.game_id)
    .all<{ player_id: string }>();

  const minPlayers = mode === "simple" ? 3 : 5;
  if (players.length < minPlayers)
    return { success: false, error: `Potrzeba minimum ${minPlayers} graczy (nie licząc MG)` };

  const n = players.length;
  const roles = buildRoles(n, customMafiaCount, mode);

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Save mode in game config for rematch
  await db.batch([
    db
      .prepare(
        "UPDATE games SET status = 'playing', phase = 'night', round = 1, config = ? WHERE id = ?"
      )
      .bind(JSON.stringify({ mode }), playerRow.game_id),
    db
      .prepare("UPDATE game_players SET role = 'gm' WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, playerRow.player_id),
    ...players.map((p, i) =>
      db
        .prepare("UPDATE game_players SET role = ? WHERE game_id = ? AND player_id = ?")
        .bind(roles[i], playerRow.game_id, p.player_id)
    ),
  ]);

  return { success: true };
}

// ---------------------------------------------------------------------------
// changePhase  (only host)
// ---------------------------------------------------------------------------
export async function changePhase(
  db: D1Database,
  token: string,
  newPhase: GamePhase
): Promise<{
  success: boolean;
  error?: string;
  pendingMissions?: { id: string; description: string; nickname: string }[];
}> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może zmieniać fazę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.status !== "playing") return { success: false, error: "Gra nie trwa" };

  const currentPhase = gameRow.phase as GamePhase;

  const validTransitions: Partial<Record<GamePhase, GamePhase[]>> = {
    night: ["day"],
    day: ["voting"],
    voting: ["night"],
  };

  if (!validTransitions[currentPhase]?.includes(newPhase)) {
    return {
      success: false,
      error: `Nieprawidłowe przejście: ${currentPhase} → ${newPhase}`,
    };
  }

  let round = gameRow.round;

  // Resolve outgoing phase
  if (currentPhase === "night") {
    await resolveNight(db, gameRow, playerRow);
  } else if (currentPhase === "voting") {
    await resolveVoting(db, gameRow, playerRow);
  }

  // New round starts when transitioning to night (except first night which is round 1)
  if (newPhase === "night" && currentPhase === "voting") {
    round++;
  }

  // Check win conditions after elimination
  const winner = await checkWinConditions(db, playerRow.game_id);
  if (winner) {
    // Check for unrated missions before ending
    const { results: pendingMissions } = await db
      .prepare(
        "SELECT m.id, m.description, gp.nickname FROM missions m JOIN game_players gp ON gp.game_id = m.game_id AND gp.player_id = m.player_id WHERE m.game_id = ? AND m.is_completed = 0"
      )
      .bind(playerRow.game_id)
      .all<{ id: string; description: string; nickname: string }>();

    if (pendingMissions.length > 0) {
      // Don't end yet — set phase to 'review' so GM can rate missions
      await db
        .prepare("UPDATE games SET phase = 'review', round = ? WHERE id = ?")
        .bind(round, playerRow.game_id)
        .run();
      return {
        success: true,
        pendingMissions: pendingMissions.map((m) => ({
          id: m.id,
          description: m.description,
          nickname: m.nickname,
        })),
      };
    }

    await db
      .prepare("UPDATE games SET status = 'finished', phase = 'ended', winner = ? WHERE id = ?")
      .bind(winner, playerRow.game_id)
      .run();
    // Broadcast end message
    const endMsg =
      winner === "mafia"
        ? "Mafia wygrała! Przejęli kontrolę nad miastem."
        : "Miasto wygrało! Wszyscy mafiosi zostali wyeliminowani.";
    await db
      .prepare(
        "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
      )
      .bind(nanoid(), playerRow.game_id, playerRow.player_id, endMsg, now())
      .run();
    return { success: true };
  }

  await db
    .prepare("UPDATE games SET phase = ?, round = ? WHERE id = ?")
    .bind(newPhase, round, playerRow.game_id)
    .run();

  return { success: true };
}

async function resolveNight(
  db: D1Database,
  gameRow: GameRow,
  hostPlayer: GamePlayerRow
): Promise<void> {
  const { aliveMafia, killActions } = await getMafiaKillActions(db, gameRow.id, gameRow.round);

  let nightMsg = "Tej nocy nikt nie zginął.";
  let msgInserted = false;

  // Check for unanimous mafia vote
  if (aliveMafia.length > 0) {
    const mafiaPlayerIds = new Set(aliveMafia.map((m) => m.player_id));
    const votedMafia = killActions.filter((action) => mafiaPlayerIds.has(action.player_id));

    // Check if all alive mafia voted for the same target
    const allMafiaVoted = votedMafia.length === aliveMafia.length;
    const targets = [...new Set(votedMafia.map((action) => action.target_player_id))];
    const unanimous = targets.length === 1 && allMafiaVoted;

    if (unanimous && targets[0]) {
      const targetPlayerId = targets[0];

      // Check if doctor protected the target
      const protectAction = await db
        .prepare(
          "SELECT id FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'night' AND action_type = 'protect' AND target_player_id = ? LIMIT 1"
        )
        .bind(gameRow.id, gameRow.round, targetPlayerId)
        .first<{ id: string }>();

      if (!protectAction) {
        // Pre-fetch nickname before the batch
        const killed = await db
          .prepare("SELECT nickname FROM game_players WHERE game_id = ? AND player_id = ?")
          .bind(gameRow.id, targetPlayerId)
          .first<{ nickname: string }>();

        nightMsg = `Tej nocy zginął: ${killed?.nickname ?? "gracz"}.`;

        // Atomic: mark dead + broadcast night result in one batch
        await db.batch([
          db
            .prepare("UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?")
            .bind(gameRow.id, targetPlayerId),
          db
            .prepare(
              "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
            )
            .bind(nanoid(), gameRow.id, hostPlayer.player_id, nightMsg, now()),
        ]);
        msgInserted = true;
      } else {
        nightMsg = "Tej nocy nikt nie zginął — ktoś był chroniony.";
      }
    } else {
      // Mafia exists but didn't reach consensus
      const disagreed = votedMafia.length > 0 && targets.length > 1;
      nightMsg = disagreed ? "Mafia nie mogła się zdecydować." : "Tej nocy nikt nie zginął.";
    }
  }

  // Resolve detective investigation
  const investigateAction = await db
    .prepare(
      "SELECT * FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'night' AND action_type = 'investigate' LIMIT 1"
    )
    .bind(gameRow.id, gameRow.round)
    .first<GameActionRow>();

  if (investigateAction?.target_player_id) {
    const target = await db
      .prepare("SELECT role, nickname FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(gameRow.id, investigateAction.target_player_id)
      .first<{ role: string | null; nickname: string }>();

    const resultData = JSON.stringify({
      targetNickname: target?.nickname ?? "gracz",
      isMafia: target?.role === "mafia",
      round: gameRow.round,
    });
    await db
      .prepare("UPDATE game_actions SET data = ? WHERE id = ?")
      .bind(resultData, investigateAction.id)
      .run();
  }

  // Broadcast night result (if not already done atomically in the kill batch)
  if (!msgInserted) {
    await db
      .prepare(
        "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
      )
      .bind(nanoid(), gameRow.id, hostPlayer.player_id, nightMsg, now())
      .run();
  }
}

async function resolveVoting(
  db: D1Database,
  gameRow: GameRow,
  hostPlayer: GamePlayerRow
): Promise<void> {
  const topVote = await db
    .prepare(
      "SELECT target_player_id, COUNT(*) as vote_count FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'voting' AND action_type = 'vote' AND target_player_id IS NOT NULL GROUP BY target_player_id ORDER BY vote_count DESC LIMIT 1"
    )
    .bind(gameRow.id, gameRow.round)
    .first<{ target_player_id: string; vote_count: number }>();

  let voteMsg = "Głosowanie zakończone — nikt nie został wyeliminowany.";

  if (topVote?.target_player_id) {
    await db
      .prepare("UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?")
      .bind(gameRow.id, topVote.target_player_id)
      .run();

    const eliminated = await db
      .prepare("SELECT nickname FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(gameRow.id, topVote.target_player_id)
      .first<{ nickname: string }>();

    voteMsg = `Głosowanie: ${eliminated?.nickname ?? "gracz"} został wyeliminowany.`;
  }

  await db
    .prepare(
      "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
    )
    .bind(nanoid(), gameRow.id, hostPlayer.player_id, voteMsg, now())
    .run();
}

async function checkWinConditions(db: D1Database, gameId: string): Promise<string | null> {
  const { results: alive } = await db
    .prepare("SELECT role FROM game_players WHERE game_id = ? AND is_alive = 1 AND is_host = 0")
    .bind(gameId)
    .all<{ role: string | null }>();

  const aliveMafia = alive.filter((p) => p.role === "mafia").length;
  const aliveOthers = alive.filter((p) => p.role !== "mafia" && p.role !== "gm").length;

  if (aliveMafia === 0) return "town";
  if (aliveMafia >= aliveOthers) return "mafia";
  return null;
}

// ---------------------------------------------------------------------------
// submitAction  (player)
// ---------------------------------------------------------------------------
export async function submitAction(
  db: D1Database,
  token: string,
  actionType: string,
  targetPlayerId?: string,
  forPlayerId?: string
): Promise<{ success: boolean; error?: string }> {
  const callerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!callerRow) return { success: false, error: "Nie znaleziono gracza" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(callerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.status !== "playing") return { success: false, error: "Gra nie trwa" };

  // GM can act on behalf of another player
  let playerRow = callerRow;
  if (forPlayerId && callerRow.is_host) {
    const targetPlayer = await db
      .prepare("SELECT * FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(callerRow.game_id, forPlayerId)
      .first<GamePlayerRow>();
    if (!targetPlayer) return { success: false, error: "Gracz nie istnieje" };
    playerRow = targetPlayer;
  } else if (forPlayerId) {
    return { success: false, error: "Tylko MG może działać za innych graczy" };
  }

  if (!playerRow.is_alive)
    return { success: false, error: "Wyeliminowani gracze nie mogą działać" };

  const phase = gameRow.phase as GamePhase;
  const role = playerRow.role as Role | null;

  // Validate action for phase + role
  if (phase === "night") {
    if (actionType === "kill" && role !== "mafia")
      return { success: false, error: "Tylko mafia może wybierać ofiary" };
    if (actionType === "investigate" && role !== "detective")
      return { success: false, error: "Tylko detektyw może sprawdzać" };
    if (actionType === "protect" && role !== "doctor")
      return { success: false, error: "Tylko doktor może chronić" };
    if (!["kill", "investigate", "protect", "wait"].includes(actionType))
      return { success: false, error: "Nieprawidłowa akcja nocna" };
  } else if (phase === "voting") {
    if (actionType !== "vote") return { success: false, error: "Teraz można tylko głosować" };
  } else {
    return { success: false, error: "Akcje można składać tylko w nocy lub podczas głosowania" };
  }

  // Validate target
  if (targetPlayerId) {
    const target = await db
      .prepare("SELECT is_alive FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, targetPlayerId)
      .first<{ is_alive: number }>();
    if (!target) return { success: false, error: "Cel nie istnieje" };
    if (!target.is_alive) return { success: false, error: "Cel jest już wyeliminowany" };
  }

  // Allow changing decision — delete old action if exists, then insert new
  const existing = await db
    .prepare(
      "SELECT id FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ?"
    )
    .bind(playerRow.game_id, playerRow.player_id, gameRow.round, phase)
    .first<{ id: string }>();
  if (existing) {
    await db.prepare("DELETE FROM game_actions WHERE id = ?").bind(existing.id).run();
  }

  await db
    .prepare(
      "INSERT INTO game_actions (id, game_id, round, phase, player_id, action_type, target_player_id, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      gameRow.round,
      phase,
      playerRow.player_id,
      actionType,
      targetPlayerId ?? null,
      now()
    )
    .run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// sendMessage  (host only)
// ---------------------------------------------------------------------------
export async function sendMessage(
  db: D1Database,
  token: string,
  content: string,
  toPlayerId?: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może wysyłać wiadomości" };

  await db
    .prepare(
      "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      playerRow.player_id,
      toPlayerId ?? null,
      content.trim(),
      now()
    )
    .run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// kickPlayer  (host only, lobby only)
// ---------------------------------------------------------------------------
export async function kickPlayer(
  db: D1Database,
  token: string,
  targetPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może usuwać graczy" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.status !== "lobby")
    return { success: false, error: "Można usuwać graczy tylko w lobby" };

  if (targetPlayerId === playerRow.player_id)
    return { success: false, error: "Nie możesz usunąć siebie" };

  await db
    .prepare("DELETE FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, targetPlayerId)
    .run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// createMission  (host only)
// ---------------------------------------------------------------------------
export async function createMission(
  db: D1Database,
  token: string,
  targetPlayerId: string,
  description: string,
  isSecret: boolean,
  points: number
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może tworzyć misje" };

  // Verify target is in the same game
  const target = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, targetPlayerId)
    .first<{ player_id: string }>();
  if (!target) return { success: false, error: "Gracz nie istnieje w tej grze" };

  await db
    .prepare(
      "INSERT INTO missions (id, game_id, player_id, description, is_secret, is_completed, points, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      targetPlayerId,
      description.trim(),
      isSecret ? 1 : 0,
      points,
      now()
    )
    .run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// transferGm  (host only)
// ---------------------------------------------------------------------------
export async function transferGm(
  db: D1Database,
  token: string,
  newHostPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może przekazać rolę" };

  if (playerRow.player_id === newHostPlayerId) return { success: false, error: "Już jesteś MG" };

  const target = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, newHostPlayerId)
    .first<{ player_id: string }>();
  if (!target) return { success: false, error: "Gracz nie istnieje" };

  await db.batch([
    db
      .prepare("UPDATE game_players SET is_host = 0 WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, playerRow.player_id),
    db
      .prepare("UPDATE game_players SET is_host = 1 WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, newHostPlayerId),
    db
      .prepare("UPDATE games SET host_player_id = ? WHERE id = ?")
      .bind(newHostPlayerId, playerRow.game_id),
  ]);

  return { success: true };
}

// ---------------------------------------------------------------------------
// rematch  (host only) — reset game for another round, same players/tokens
// ---------------------------------------------------------------------------
export async function rematch(
  db: D1Database,
  token: string,
  customMafiaCount?: number,
  mode?: "full" | "simple"
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może zacząć następną rundę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.status !== "finished")
    return { success: false, error: "Gra nie jest jeszcze zakończona" };

  // Only non-host players get roles
  const { results: players } = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ? AND is_host = 0")
    .bind(playerRow.game_id)
    .all<{ player_id: string }>();

  // Use provided mode, or fallback to saved config, or default "full"
  const savedConfig = JSON.parse(gameRow.config || "{}");
  const effectiveMode = mode ?? savedConfig.mode ?? "full";
  const minPlayers = effectiveMode === "simple" ? 3 : 5;
  if (players.length < minPlayers)
    return { success: false, error: `Potrzeba minimum ${minPlayers} graczy (nie licząc MG)` };

  const n = players.length;
  const roles = buildRoles(n, customMafiaCount, effectiveMode);
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  await db.batch([
    db.prepare("DELETE FROM missions WHERE game_id = ?").bind(playerRow.game_id),
    db.prepare("DELETE FROM game_actions WHERE game_id = ?").bind(playerRow.game_id),
    db.prepare("DELETE FROM messages WHERE game_id = ?").bind(playerRow.game_id),
    db
      .prepare(
        "UPDATE games SET status = 'playing', phase = 'night', round = 1, winner = NULL, config = ? WHERE id = ?"
      )
      .bind(JSON.stringify({ mode: effectiveMode }), playerRow.game_id),
    db
      .prepare(
        "UPDATE game_players SET role = 'gm', is_alive = 1 WHERE game_id = ? AND player_id = ?"
      )
      .bind(playerRow.game_id, playerRow.player_id),
    ...players.map((p, i) =>
      db
        .prepare(
          "UPDATE game_players SET role = ?, is_alive = 1 WHERE game_id = ? AND player_id = ?"
        )
        .bind(roles[i], playerRow.game_id, p.player_id)
    ),
  ]);

  return { success: true };
}

// ---------------------------------------------------------------------------
// deleteMission  (host only)
// ---------------------------------------------------------------------------
// Finalize game after mission review
export async function finalizeGame(
  db: D1Database,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może zakończyć grę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.phase !== "review")
    return { success: false, error: "Gra nie jest w fazie przeglądu misji" };

  const winner = await checkWinConditions(db, playerRow.game_id);

  await db
    .prepare("UPDATE games SET status = 'finished', phase = 'ended', winner = ? WHERE id = ?")
    .bind(winner ?? "town", playerRow.game_id)
    .run();

  const endMsg =
    winner === "mafia"
      ? "Mafia wygrała! Przejęli kontrolę nad miastem."
      : "Miasto wygrało! Wszyscy mafiosi zostali wyeliminowani.";
  await db
    .prepare(
      "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
    )
    .bind(nanoid(), playerRow.game_id, playerRow.player_id, endMsg, now())
    .run();

  return { success: true };
}

export async function deleteMission(
  db: D1Database,
  token: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może usuwać misje" };

  const mission = await db
    .prepare("SELECT id FROM missions WHERE id = ? AND game_id = ?")
    .bind(missionId, playerRow.game_id)
    .first<{ id: string }>();
  if (!mission) return { success: false, error: "Misja nie istnieje" };

  await db.prepare("DELETE FROM missions WHERE id = ?").bind(missionId).run();
  return { success: true };
}

// ---------------------------------------------------------------------------
// completeMission  (host only)
// ---------------------------------------------------------------------------
export async function completeMission(
  db: D1Database,
  token: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może zatwierdzać misje" };

  const mission = await db
    .prepare("SELECT id FROM missions WHERE id = ? AND game_id = ?")
    .bind(missionId, playerRow.game_id)
    .first<{ id: string }>();
  if (!mission) return { success: false, error: "Misja nie istnieje" };

  await db.prepare("UPDATE missions SET is_completed = 1 WHERE id = ?").bind(missionId).run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// renamePlayer
// ---------------------------------------------------------------------------
export async function renamePlayer(
  db: D1Database,
  token: string,
  newNickname: string
): Promise<{ success: boolean; error?: string }> {
  // Validate nickname length
  if (newNickname.length < 1 || newNickname.length > 20) {
    return { success: false, error: "Nazwa gracza musi mieć 1-20 znaków" };
  }

  // Check if player exists
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow) return { success: false, error: "Nie znaleziono gracza" };

  // Update player nickname
  await db
    .prepare("UPDATE game_players SET nickname = ? WHERE token = ?")
    .bind(newNickname, token)
    .run();

  return { success: true };
}

// ---------------------------------------------------------------------------
// leaveGame
// ---------------------------------------------------------------------------
export async function leaveGame(
  db: D1Database,
  token: string
): Promise<{ success: boolean; error?: string; gameEnded?: boolean }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow) return { success: false, error: "Nie znaleziono gracza" };

  // GM cannot leave — must transfer first
  if (playerRow.is_host)
    return { success: false, error: "Mistrz gry nie może opuścić gry. Najpierw przekaż rolę MG." };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow) return { success: false, error: "Gra nie istnieje" };

  // Lobby — just remove the player
  if (gameRow.status === "lobby") {
    await db
      .prepare("DELETE FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, playerRow.player_id)
      .run();
    return { success: true };
  }

  // Finished — nothing to do
  if (gameRow.status === "finished") return { success: true };

  // Playing — mark as eliminated + clean up actions
  await db
    .prepare("UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, playerRow.player_id)
    .run();

  // Remove their current round/phase actions
  await db
    .prepare(
      "DELETE FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ?"
    )
    .bind(playerRow.game_id, playerRow.player_id, gameRow.round, gameRow.phase)
    .run();

  // Check win conditions
  const winner = await checkWinConditions(db, playerRow.game_id);
  if (winner) {
    await db
      .prepare("UPDATE games SET status = 'finished', phase = 'ended', winner = ? WHERE id = ?")
      .bind(winner, playerRow.game_id)
      .run();

    const endMsg =
      winner === "mafia"
        ? "Mafia wygrała! Przejęli kontrolę nad miastem."
        : "Miasto wygrało! Wszyscy mafiosi zostali wyeliminowani.";
    await db
      .prepare(
        "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
      )
      .bind(nanoid(), playerRow.game_id, playerRow.player_id, endMsg, now())
      .run();

    return { success: true, gameEnded: true };
  }

  // Send GM notification
  await db
    .prepare(
      "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      playerRow.player_id,
      `${playerRow.nickname} opuścił grę.`,
      now()
    )
    .run();

  return { success: true, gameEnded: false };
}

// ---------------------------------------------------------------------------
// getCharacters - Returns list of active characters
// ---------------------------------------------------------------------------
export async function getCharacters(db: D1Database): Promise<CharacterRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM characters WHERE is_active = 1 ORDER BY sort_order ASC")
    .all<CharacterRow>();
  return results;
}

// ---------------------------------------------------------------------------
// updateCharacter - Update player's character selection
// ---------------------------------------------------------------------------
export async function updateCharacter(
  db: D1Database,
  token: string,
  characterId: string
): Promise<boolean> {
  // Validate that the character exists and is active
  const character = await db
    .prepare("SELECT id FROM characters WHERE id = ? AND is_active = 1")
    .bind(characterId)
    .first<{ id: string }>();
  if (!character) return false;

  // Find the player by token
  const player = await db
    .prepare("SELECT game_id, player_id FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string; player_id: string }>();
  if (!player) return false;

  // Update the character
  await db
    .prepare("UPDATE game_players SET character_id = ? WHERE token = ?")
    .bind(characterId, token)
    .run();

  return true;
}

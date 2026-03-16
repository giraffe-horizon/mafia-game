import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Minimal D1 type declarations (avoids @cloudflare/workers-types dependency)
// ---------------------------------------------------------------------------
export interface D1PreparedStatement {
  bind(...values: (string | number | boolean | null)[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<void>;
  batch(statements: D1PreparedStatement[]): Promise<Array<{ results?: unknown[] }>>;
}

// ---------------------------------------------------------------------------
// Row types (SQLite → TypeScript)
// ---------------------------------------------------------------------------
interface GameRow {
  id: string;
  code: string;
  host_player_id: string;
  status: string;
  phase: string;
  phase_deadline: string | null;
  round: number;
  winner: string | null;
  config: string;
  created_at: string;
}

interface GamePlayerRow {
  game_id: string;
  player_id: string;
  token: string;
  nickname: string;
  role: string | null;
  is_alive: number;
  is_host: number;
}

interface MessageRow {
  id: string;
  game_id: string;
  from_player_id: string;
  to_player_id: string | null;
  content: string;
  is_read: number;
  created_at: string;
}

interface GameActionRow {
  id: string;
  game_id: string;
  round: number;
  phase: string;
  player_id: string;
  action_type: string;
  target_player_id: string | null;
  data: string;
  created_at: string;
}

interface MissionRow {
  id: string;
  game_id: string;
  player_id: string;
  description: string;
  is_secret: number;
  is_completed: number;
  points: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export type GameStatus = "lobby" | "playing" | "finished";
export type GamePhase = "lobby" | "night" | "day" | "voting" | "ended";
export type Role = "mafia" | "detective" | "doctor" | "civilian";

export interface PublicPlayer {
  playerId: string;
  nickname: string;
  isAlive: boolean;
  isHost: boolean;
  role: Role | null;
  isYou: boolean;
}

export interface GameStateResponse {
  game: {
    id: string;
    code: string;
    status: GameStatus;
    phase: GamePhase;
    round: number;
    winner: string | null;
  };
  currentPlayer: {
    playerId: string;
    nickname: string;
    token: string;
    role: Role | null;
    isAlive: boolean;
    isHost: boolean;
  };
  players: PublicPlayer[];
  messages: { id: string; content: string; createdAt: string }[];
  missions: {
    id: string;
    description: string;
    isSecret: boolean;
    isCompleted: boolean;
    points: number;
  }[];
  detectiveResult: {
    targetNickname: string;
    isMafia: boolean;
    round: number;
  } | null;
  myAction: { actionType: string; targetPlayerId: string | null } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "MAFIA-" + s;
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// createGame
// ---------------------------------------------------------------------------
export async function createGame(
  db: D1Database,
  hostNickname: string
): Promise<{ token: string }> {
  const gameId = nanoid();
  const hostPlayerId = nanoid();
  const hostToken = nanoid();

  let code = generateSessionCode();
  while (await db.prepare("SELECT id FROM games WHERE code = ?").bind(code).first()) {
    code = generateSessionCode();
  }

  await db.batch([
    db.prepare(
      "INSERT INTO games (id, code, host_player_id, status, phase, round, winner, config, created_at) VALUES (?, ?, ?, 'lobby', 'lobby', 0, NULL, '{}', ?)"
    ).bind(gameId, code, hostPlayerId, now()),
    db.prepare(
      "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host) VALUES (?, ?, ?, ?, NULL, 1, 1)"
    ).bind(gameId, hostPlayerId, hostToken, hostNickname.trim()),
  ]);

  return { token: hostToken };
}

// ---------------------------------------------------------------------------
// joinGame
// ---------------------------------------------------------------------------
export async function joinGame(
  db: D1Database,
  code: string,
  nickname: string
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
      "INSERT INTO game_players (game_id, player_id, token, nickname, role, is_alive, is_host) VALUES (?, ?, ?, ?, NULL, 1, 0)"
    )
    .bind(game.id, playerId, token, nickname.trim())
    .run();

  return { token };
}

// ---------------------------------------------------------------------------
// getGameState
// ---------------------------------------------------------------------------
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

  const { results: allPlayers } = await db
    .prepare("SELECT * FROM game_players WHERE game_id = ? ORDER BY is_host DESC, nickname ASC")
    .bind(playerRow.game_id)
    .all<GamePlayerRow>();

  // Get unread messages (not from self, broadcast or targeted at me)
  const { results: messages } = await db
    .prepare(
      "SELECT * FROM messages WHERE game_id = ? AND (to_player_id IS NULL OR to_player_id = ?) AND from_player_id != ? AND is_read = 0 ORDER BY created_at ASC"
    )
    .bind(playerRow.game_id, playerRow.player_id, playerRow.player_id)
    .all<MessageRow>();

  // Mark them as read (batch)
  if (messages.length > 0) {
    await db.batch(
      messages.map((m) =>
        db.prepare("UPDATE messages SET is_read = 1 WHERE id = ?").bind(m.id)
      )
    );
  }

  // Get active (non-completed) missions for this player
  const { results: missionRows } = await db
    .prepare(
      "SELECT * FROM missions WHERE game_id = ? AND player_id = ? AND is_completed = 0 ORDER BY created_at ASC"
    )
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
    },
    players: allPlayers.map((p) => ({
      playerId: p.player_id,
      nickname: p.nickname,
      isAlive: p.is_alive === 1,
      isHost: p.is_host === 1,
      // Host sees all roles; player sees own role during game; roles visible to all when finished
      role:
        isHost ||
        gameRow.status === "finished" ||
        (gameRow.status === "playing" && p.token === token)
          ? (p.role as Role | null)
          : null,
      isYou: p.token === token,
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
  };
}

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------
export async function startGame(
  db: D1Database,
  token: string
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

  const { results: players } = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ?")
    .bind(playerRow.game_id)
    .all<{ player_id: string }>();

  if (players.length < 4) return { success: false, error: "Potrzeba minimum 4 graczy" };

  const n = players.length;
  const mafiaCount = Math.ceil(n / 3);
  const roles: Role[] = [
    ...Array<Role>(mafiaCount).fill("mafia"),
    "detective",
    "doctor",
    ...Array<Role>(n - mafiaCount - 2).fill("civilian"),
  ];

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  await db.batch([
    db.prepare("UPDATE games SET status = 'playing', phase = 'night', round = 1 WHERE id = ?").bind(
      playerRow.game_id
    ),
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
): Promise<{ success: boolean; error?: string }> {
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
    round++;
  }

  // Check win conditions after elimination
  const winner = await checkWinConditions(db, playerRow.game_id);
  if (winner) {
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
  const killAction = await db
    .prepare(
      "SELECT * FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'night' AND action_type = 'kill' ORDER BY created_at DESC LIMIT 1"
    )
    .bind(gameRow.id, gameRow.round)
    .first<GameActionRow>();

  let nightMsg = "Tej nocy nikt nie zginął.";

  if (killAction?.target_player_id) {
    // Check if doctor protected the target
    const protectAction = await db
      .prepare(
        "SELECT id FROM game_actions WHERE game_id = ? AND round = ? AND phase = 'night' AND action_type = 'protect' AND target_player_id = ? LIMIT 1"
      )
      .bind(gameRow.id, gameRow.round, killAction.target_player_id)
      .first<{ id: string }>();

    if (!protectAction) {
      await db
        .prepare(
          "UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?"
        )
        .bind(gameRow.id, killAction.target_player_id)
        .run();

      const killed = await db
        .prepare(
          "SELECT nickname FROM game_players WHERE game_id = ? AND player_id = ?"
        )
        .bind(gameRow.id, killAction.target_player_id)
        .first<{ nickname: string }>();

      nightMsg = `Tej nocy zginął: ${killed?.nickname ?? "gracz"}.`;
    } else {
      nightMsg = "Tej nocy nikt nie zginął — ktoś był chroniony.";
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
      .prepare(
        "SELECT role, nickname FROM game_players WHERE game_id = ? AND player_id = ?"
      )
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

  // Broadcast night result
  await db
    .prepare(
      "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)"
    )
    .bind(nanoid(), gameRow.id, hostPlayer.player_id, nightMsg, now())
    .run();
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
      .prepare(
        "UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?"
      )
      .bind(gameRow.id, topVote.target_player_id)
      .run();

    const eliminated = await db
      .prepare(
        "SELECT nickname FROM game_players WHERE game_id = ? AND player_id = ?"
      )
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
    .prepare("SELECT role FROM game_players WHERE game_id = ? AND is_alive = 1")
    .bind(gameId)
    .all<{ role: string | null }>();

  const aliveMafia = alive.filter((p) => p.role === "mafia").length;
  const aliveOthers = alive.filter((p) => p.role !== "mafia").length;

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
  targetPlayerId?: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow) return { success: false, error: "Nie znaleziono gracza" };
  if (!playerRow.is_alive) return { success: false, error: "Wyeliminowani gracze nie mogą działać" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow || gameRow.status !== "playing") return { success: false, error: "Gra nie trwa" };

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
    if (!["kill", "investigate", "protect"].includes(actionType))
      return { success: false, error: "Nieprawidłowa akcja nocna" };
  } else if (phase === "voting") {
    if (actionType !== "vote") return { success: false, error: "Teraz można tylko głosować" };
  } else {
    return { success: false, error: "Akcje można składać tylko w nocy lub podczas głosowania" };
  }

  // Prevent duplicate action in same phase
  const existing = await db
    .prepare(
      "SELECT id FROM game_actions WHERE game_id = ? AND player_id = ? AND round = ? AND phase = ?"
    )
    .bind(playerRow.game_id, playerRow.player_id, gameRow.round, phase)
    .first<{ id: string }>();
  if (existing) return { success: false, error: "Już złożyłeś akcję w tej fazie" };

  // Validate target
  if (targetPlayerId) {
    const target = await db
      .prepare(
        "SELECT is_alive FROM game_players WHERE game_id = ? AND player_id = ?"
      )
      .bind(playerRow.game_id, targetPlayerId)
      .first<{ is_alive: number }>();
    if (!target) return { success: false, error: "Cel nie istnieje" };
    if (!target.is_alive) return { success: false, error: "Cel jest już wyeliminowany" };
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

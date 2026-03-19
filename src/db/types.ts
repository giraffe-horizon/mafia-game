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
export interface GameRow {
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

export interface GamePlayerRow {
  game_id: string;
  player_id: string;
  token: string;
  nickname: string;
  role: string | null;
  is_alive: number;
  is_host: number;
  character_id?: string;
}

export interface MessageRow {
  id: string;
  game_id: string;
  from_player_id: string;
  to_player_id: string | null;
  content: string;
  is_read: number;
  created_at: string;
}

export interface GameActionRow {
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

export interface MissionRow {
  id: string;
  game_id: string;
  player_id: string;
  description: string;
  is_secret: number;
  is_completed: number;
  points: number;
  created_at: string;
}

export interface PlayerRoundScoreRow {
  id: string;
  game_id: string;
  round: number;
  player_id: string;
  mission_points: number;
  survived: number;
  won: number;
  total_score: number;
  created_at: string;
}

export interface CharacterRow {
  id: string;
  slug: string;
  name: string;
  name_pl: string;
  gender: string;
  description: string | null;
  avatar_url: string;
  is_active: number;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------
export type GameStatus = "lobby" | "playing" | "finished";
export type GamePhase = "lobby" | "night" | "day" | "voting" | "review" | "ended";
export type Role = "mafia" | "detective" | "doctor" | "civilian";
export type ActionType = "kill" | "investigate" | "protect" | "vote" | "wait";

export interface PublicPlayer {
  playerId: string;
  nickname: string;
  isAlive: boolean;
  isHost: boolean;
  role: Role | null;
  isYou: boolean;
  character: { id: string; slug: string; namePl: string; avatarUrl: string } | null;
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
    isSetupComplete: boolean;
    character: { id: string; slug: string; namePl: string; avatarUrl: string } | null;
  };
  takenCharacterIds: string[];
  players: PublicPlayer[];
  messages: { id: string; content: string; createdAt: string }[];
  missions: {
    id: string;
    description: string;
    isSecret: boolean;
    isCompleted: boolean;
    points: number;
  }[];
  investigatedPlayers?: { playerId: string; isMafia: boolean }[];
  detectiveResult: {
    targetNickname: string;
    isMafia: boolean;
    round: number;
  } | null;
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  // Mafia only: team votes in current phase (night kill targets + voting)
  mafiaTeamActions?: {
    nickname: string;
    targetPlayerId: string | null;
    targetNickname: string | null;
  }[];
  // Voting phase: live tally visible to all
  voteTally?: {
    totalVoters: number;
    votedCount: number;
    results: { nickname: string; playerId: string; votes: number }[];
  };
  // Host only: all actions in current round/phase
  hostActions?: {
    playerId: string;
    nickname: string;
    actionType: string;
    targetPlayerId: string | null;
    targetNickname: string | null;
  }[];
  // Host only: all missions in game
  hostMissions?: {
    id: string;
    playerId: string;
    playerNickname: string;
    description: string;
    isSecret: boolean;
    isCompleted: boolean;
    points: number;
  }[];
  // Host only: phase progress tracking
  phaseProgress?: {
    phase: string;
    requiredActions: { playerId: string; nickname: string; role: string; done: boolean }[];
    allDone: boolean;
    hint: string;
    mafiaUnanimous: boolean;
  };
  // Lobby settings persisted across rounds
  lobbySettings?: {
    mode: "full" | "simple";
    mafiaCount: number; // 0 = auto
  };
  // Whether to show points/missions to players (only during review/finished)
  showPoints: boolean;
  // History of votes from previous rounds (for GŁOSY tab)
  voteHistory?: {
    round: number;
    results: {
      nickname: string;
      playerId: string;
      votes: number;
      eliminated: boolean;
    }[];
  }[];
  // Summary of last night's events (for NOC tab during day/voting)
  lastNightSummary?: {
    round: number;
    killedNickname: string | null; // null = nobody died
    savedByDoctor: boolean;
  };
  // System event messages grouped per round (for LOGI tab)
  gameLog?: {
    round: number;
    events: {
      type: string;
      description: string;
      timestamp: string;
    }[];
  }[];
}

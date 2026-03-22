// ---------------------------------------------------------------------------
// WebSocket message types (shared between client and worker)
// MIRROR: These types are duplicated in src/features/game/types.ts (frontend).
// Keep both files in sync when changing message shapes.
// Worker uses `payload: any` because it cannot import GameStateResponse.
// ---------------------------------------------------------------------------

// Client -> Server messages
export type WsClientMessage = { type: "auth"; token: string } | { type: "ping" };

// Server -> Client messages
export type WsServerMessage =
  | { type: "state"; payload: any; seq: number }
  | { type: "timer"; deadline: string; remainingMs: number }
  | { type: "error"; code: string; message: string }
  | { type: "pong" };

// WebSocket connection state (stored via serializeAttachment/deserializeAttachment)
export interface ConnectionState {
  gameId: string;
  token: string;
  playerId: string;
  authenticated: boolean;
  connectedAt: number;
}

// Durable Object environment bindings
export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  DB: D1Database;
  NOTIFY_SECRET: string;
}

// ---------------------------------------------------------------------------
// WebSocket message types (shared between client and worker)
// ---------------------------------------------------------------------------

// Client -> Server messages
export type WsClientMessage = { type: "auth"; token: string } | { type: "ping" };

// Server -> Client messages
export type WsServerMessage =
  | { type: "state"; payload: any; seq: number }
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

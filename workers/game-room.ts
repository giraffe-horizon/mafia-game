// ---------------------------------------------------------------------------
// GameRoom Durable Object - WebSocket Hibernation API implementation
// ---------------------------------------------------------------------------

import { DurableObject } from "cloudflare:workers";
import type { WsClientMessage, WsServerMessage, ConnectionState, Env } from "./types";

export class GameRoom extends DurableObject<Env> {
  private startedAt = Date.now();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  // ---------------------------------------------------------------------------
  // Structured metric logging (parseable key=value format for CF Dashboard)
  // ---------------------------------------------------------------------------

  private metric(event: string, fields: Record<string, string | number | boolean>): void {
    const parts = Object.entries(fields)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    console.log(`[metric] ${event} ${parts}`);
  }

  // ---------------------------------------------------------------------------
  // Helpers: attachment-based connection state (survives hibernation)
  // ---------------------------------------------------------------------------

  private getState(ws: WebSocket): ConnectionState | null {
    try {
      return ws.deserializeAttachment() as ConnectionState | null;
    } catch {
      return null;
    }
  }

  private setState(ws: WebSocket, state: ConnectionState): void {
    ws.serializeAttachment(state);
  }

  // ---------------------------------------------------------------------------
  // Helpers: sequenceNumber persisted in DO storage
  // ---------------------------------------------------------------------------

  private async nextSeq(): Promise<number> {
    const current = (await this.ctx.storage.get<number>("seq")) ?? 0;
    const next = current + 1;
    await this.ctx.storage.put("seq", next);
    return next;
  }

  // ---------------------------------------------------------------------------
  // HTTP fetch handler
  // ---------------------------------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/websocket") {
      const gameId = url.searchParams.get("gameId");
      if (!gameId) {
        return new Response("Missing gameId parameter", { status: 400 });
      }

      // Rate limit — use getWebSockets() (survives hibernation)
      if (this.ctx.getWebSockets().length >= 5) {
        this.metric("ws_rate_limit", { gameId });
        return new Response("Too many connections", { status: 429 });
      }

      // Upgrade to WebSocket using Hibernation API
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);

      // Store connection state in attachment (survives hibernation)
      const connectionState: ConnectionState = {
        gameId,
        token: "",
        playerId: "",
        authenticated: false,
        connectedAt: Date.now(),
      };
      this.setState(server, connectionState);

      // Send auth challenge
      this.sendMessage(server, {
        type: "error",
        code: "AUTH_REQUIRED",
        message: "Send auth message within 5 seconds",
      });

      this.metric("ws_connect", {
        gameId,
        connections: this.ctx.getWebSockets().length,
      });

      // NOTE: No setTimeout — auth timeout is checked in webSocketMessage

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // HTTP endpoint to trigger broadcasts (called by entry worker after secret validation)
    if (request.method === "POST" && url.pathname === "/notify") {
      const gameId = url.searchParams.get("gameId");
      if (!gameId) {
        return new Response("Missing gameId parameter", { status: 400 });
      }

      await this.broadcastGameState(gameId);
      return new Response("OK");
    }

    // Deep health check — called by entry worker /health/deep
    if (request.method === "GET" && url.pathname === "/health-check") {
      const start = Date.now();
      try {
        // D1 read check
        const row = await this.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
        const d1Ms = Date.now() - start;
        return new Response(
          JSON.stringify({
            status: "ok",
            connections: this.ctx.getWebSockets().length,
            uptimeMs: Date.now() - this.startedAt,
            d1: { status: row?.ok === 1 ? "ok" : "error", latencyMs: d1Ms },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            status: "error",
            error: error instanceof Error ? error.message : "D1 check failed",
            d1LatencyMs: Date.now() - start,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }

  // ---------------------------------------------------------------------------
  // WebSocket Hibernation API handlers
  // ---------------------------------------------------------------------------

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const state = this.getState(ws);

      if (!state) {
        ws.close(1008, "Connection state lost");
        return;
      }

      // Auth timeout check (replaces setTimeout which doesn't survive hibernation)
      if (!state.authenticated && Date.now() - state.connectedAt > 5000) {
        this.metric("ws_auth_timeout", { gameId: state.gameId });
        ws.close(1008, "Authentication timeout");
        return;
      }

      if (typeof message !== "string") {
        this.sendMessage(ws, {
          type: "error",
          code: "INVALID_MESSAGE",
          message: "Only text messages supported",
        });
        return;
      }

      const parsedMessage: WsClientMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case "auth":
          await this.handleAuth(ws, parsedMessage.token, state);
          break;

        case "ping":
          if (!state.authenticated) {
            this.sendMessage(ws, {
              type: "error",
              code: "NOT_AUTHENTICATED",
              message: "Authentication required",
            });
            return;
          }
          this.sendMessage(ws, { type: "pong" });
          break;

        default:
          this.sendMessage(ws, {
            type: "error",
            code: "UNKNOWN_MESSAGE_TYPE",
            message: "Unknown message type",
          });
      }
    } catch (error) {
      const state = this.getState(ws);
      const msg = error instanceof Error ? error.message : String(error);
      this.metric("ws_error", {
        gameId: state?.gameId ?? "unknown",
        code: "PARSE_ERROR",
        message: msg,
      });
      this.sendMessage(ws, { type: "error", code: "PARSE_ERROR", message: "Invalid JSON" });
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const state = this.getState(ws);
    if (state) {
      const duration = Date.now() - state.connectedAt;
      this.metric("ws_disconnect", {
        gameId: state.gameId,
        playerId: state.playerId || "unknown",
        durationMs: duration,
        code,
        reason: reason || "none",
      });
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    const state = this.getState(ws);
    const gameId = state?.gameId ?? "unknown";
    const msg = error instanceof Error ? error.message : String(error);
    this.metric("ws_error", { gameId, code: "WS_ERROR", message: msg });
  }

  // Alarm handler — periodic timer broadcast (every 5s while deadline is active)
  async alarm(): Promise<void> {
    const sockets = this.ctx.getWebSockets();
    if (sockets.length === 0) return;

    // Find gameId from any authenticated connection
    let gameId: string | null = null;
    for (const ws of sockets) {
      const state = this.getState(ws);
      if (state?.authenticated && state.gameId) {
        gameId = state.gameId;
        break;
      }
    }
    if (!gameId) return;

    const timerMsg = await this.getTimerMessage(gameId);
    if (!timerMsg) return;

    // Broadcast timer to all authenticated clients
    for (const ws of sockets) {
      const state = this.getState(ws);
      if (state?.authenticated && state.gameId === gameId) {
        this.sendMessage(ws, timerMsg);
      }
    }

    // Schedule next alarm in 5 seconds
    await this.ctx.storage.setAlarm(Date.now() + 5000);
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  private async handleAuth(ws: WebSocket, token: string, state: ConnectionState): Promise<void> {
    try {
      const playerRow = await this.env.DB.prepare(
        "SELECT game_id, player_id, nickname FROM game_players WHERE token = ?"
      )
        .bind(token)
        .first<{ game_id: string; player_id: string; nickname: string }>();

      if (!playerRow) {
        this.sendMessage(ws, { type: "error", code: "INVALID_TOKEN", message: "Invalid token" });
        ws.close(1008, "Invalid token");
        return;
      }

      if (playerRow.game_id !== state.gameId) {
        this.sendMessage(ws, {
          type: "error",
          code: "GAME_MISMATCH",
          message: "Token does not belong to this game",
        });
        ws.close(1008, "Game mismatch");
        return;
      }

      // Update connection state in attachment
      state.token = token;
      state.playerId = playerRow.player_id;
      state.authenticated = true;
      this.setState(ws, state);

      console.log(`Player ${playerRow.nickname} authenticated in game ${state.gameId}`);

      const gameState = await this.getGameState(state.gameId);
      const seq = await this.nextSeq();
      this.sendMessage(ws, {
        type: "state",
        payload: gameState,
        seq,
      });

      // Send current timer if active
      const timerMsg = await this.getTimerMessage(state.gameId);
      if (timerMsg) {
        this.sendMessage(ws, timerMsg);
      }
    } catch (error) {
      console.error("Auth error:", error);
      this.sendMessage(ws, { type: "error", code: "AUTH_ERROR", message: "Authentication failed" });
      ws.close(1008, "Authentication error");
    }
  }

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  private sendMessage(ws: WebSocket, message: WsServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  // Broadcast game state to all authenticated connections (uses getWebSockets, survives hibernation)
  private async broadcastGameState(gameId: string): Promise<void> {
    const broadcastStart = Date.now();
    const gameState = await this.getGameState(gameId);
    const seq = await this.nextSeq();

    // Check for active phase_deadline
    const timerMsg = await this.getTimerMessage(gameId);

    let recipients = 0;
    for (const ws of this.ctx.getWebSockets()) {
      const state = this.getState(ws);
      if (state?.authenticated && state.gameId === gameId) {
        this.sendMessage(ws, {
          type: "state",
          payload: gameState,
          seq,
        });
        // Send timer update alongside state if deadline is active
        if (timerMsg) {
          this.sendMessage(ws, timerMsg);
        }
        recipients++;
      }
    }

    this.metric("ws_broadcast", {
      gameId,
      recipients,
      latencyMs: Date.now() - broadcastStart,
      seq,
    });

    // Schedule periodic timer alarm if deadline is active and clients are connected
    if (timerMsg && recipients > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 5000);
    }
  }

  // Build a timer message from the game's phase_deadline
  private async getTimerMessage(gameId: string): Promise<WsServerMessage | null> {
    try {
      const row = await this.env.DB.prepare("SELECT phase_deadline FROM games WHERE id = ?")
        .bind(gameId)
        .first<{ phase_deadline: string | null }>();

      if (!row?.phase_deadline) return null;

      const deadlineMs = new Date(row.phase_deadline).getTime();
      const remainingMs = Math.max(0, deadlineMs - Date.now());

      if (remainingMs <= 0) return null;

      return {
        type: "timer",
        deadline: row.phase_deadline,
        remainingMs,
      };
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Game state query
  // ---------------------------------------------------------------------------

  private async getGameState(gameId: string): Promise<any> {
    try {
      const game = await this.env.DB.prepare(
        "SELECT id, code, status, phase, phase_deadline, round, winner, config FROM games WHERE id = ?"
      )
        .bind(gameId)
        .first<{
          id: string;
          code: string;
          status: string;
          phase: string;
          phase_deadline: string | null;
          round: number;
          winner: string | null;
          config: string;
        }>();

      if (!game) {
        return { error: "Game not found" };
      }

      const { results: players } = await this.env.DB.prepare(
        "SELECT player_id, nickname, role, is_alive, is_host FROM game_players WHERE game_id = ? ORDER BY is_host DESC, nickname ASC"
      )
        .bind(gameId)
        .all<{
          player_id: string;
          nickname: string;
          role: string | null;
          is_alive: number;
          is_host: number;
        }>();

      return {
        game: {
          id: game.id,
          code: game.code,
          status: game.status,
          phase: game.phase,
          round: game.round,
          winner: game.winner,
          phaseDeadline: game.phase_deadline,
          config: JSON.parse(game.config || "{}"),
        },
        players: players.map((p) => ({
          playerId: p.player_id,
          nickname: p.nickname,
          role: p.role,
          isAlive: p.is_alive === 1,
          isHost: p.is_host === 1,
        })),
        lastUpdate: Date.now(),
      };
    } catch (error) {
      console.error("Failed to get game state:", error);
      return { error: "Failed to get game state" };
    }
  }
}

/*
Manual Testing Instructions:

1. Deploy the worker:
   pnpm wrangler deploy --config wrangler.ws.jsonc

2. Test with websocat (install: cargo install websocat):
   websocat "wss://your-worker-domain.workers.dev/ws/game?gameId=test123"

3. Test with browser console:
   const ws = new WebSocket('wss://your-worker-domain.workers.dev/ws/game?gameId=test123');
   ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
   ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token: 'your-player-token' }));
   ws.send(JSON.stringify({ type: 'ping' }));

4. Test HTTP notification (requires X-Notify-Secret header):
   curl -X POST -H "X-Notify-Secret: your-secret" "https://your-worker-domain.workers.dev/notify?gameId=test123"

5. Expected flow:
   - Connect -> receive auth challenge
   - Send auth message -> receive game state
   - Send ping -> receive pong
   - HTTP notify -> all authenticated clients receive updated state

6. Rate limit test:
   - Open 6+ connections to same gameId -> 6th should get 429 error
*/

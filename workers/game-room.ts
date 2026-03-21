// ---------------------------------------------------------------------------
// GameRoom Durable Object - WebSocket Hibernation API implementation
// ---------------------------------------------------------------------------

import type { WsClientMessage, WsServerMessage, ConnectionState, Env } from "./types";

export class GameRoom extends DurableObject {
  private connectionStates = new Map<WebSocket, ConnectionState>();
  private sequenceNumber = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/websocket") {
      // Extract gameId from URL parameters
      const gameId = url.searchParams.get("gameId");
      if (!gameId) {
        return new Response("Missing gameId parameter", { status: 400 });
      }

      // Check rate limit - max 5 connections per DO
      if (this.connectionStates.size >= 5) {
        return new Response("Too many connections", { status: 429 });
      }

      // Upgrade to WebSocket using Hibernation API
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept the WebSocket connection
      this.ctx.acceptWebSocket(server);

      // Initialize connection state (unauthenticated)
      const connectionState: ConnectionState = {
        gameId,
        token: "",
        playerId: "",
        authenticated: false,
        connectedAt: Date.now(),
      };
      this.connectionStates.set(server, connectionState);

      // Send auth challenge - client has 5 seconds to authenticate
      this.sendMessage(server, {
        type: "error",
        code: "AUTH_REQUIRED",
        message: "Send auth message within 5 seconds",
      });

      // Set timeout for authentication
      setTimeout(() => {
        const state = this.connectionStates.get(server);
        if (state && !state.authenticated) {
          console.log(`Disconnecting unauthenticated connection for game ${gameId}`);
          server.close(1008, "Authentication timeout");
          this.connectionStates.delete(server);
        }
      }, 5000);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // HTTP endpoint to trigger broadcasts
    if (request.method === "POST" && url.pathname === "/notify") {
      const gameId = url.searchParams.get("gameId");
      if (!gameId) {
        return new Response("Missing gameId parameter", { status: 400 });
      }

      // Broadcast updated game state to all authenticated connections
      await this.broadcastGameState(gameId);
      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }

  // WebSocket message handler (Hibernation API)
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      if (typeof message !== "string") {
        this.sendMessage(ws, {
          type: "error",
          code: "INVALID_MESSAGE",
          message: "Only text messages supported",
        });
        return;
      }

      const parsedMessage: WsClientMessage = JSON.parse(message);
      const connectionState = this.connectionStates.get(ws);

      if (!connectionState) {
        ws.close(1008, "Connection state lost");
        return;
      }

      switch (parsedMessage.type) {
        case "auth":
          await this.handleAuth(ws, parsedMessage.token, connectionState);
          break;

        case "ping":
          if (!connectionState.authenticated) {
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
      console.error("WebSocket message error:", error);
      this.sendMessage(ws, { type: "error", code: "PARSE_ERROR", message: "Invalid JSON" });
    }
  }

  // WebSocket close handler (Hibernation API)
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const connectionState = this.connectionStates.get(ws);
    if (connectionState) {
      console.log(
        `WebSocket closed for game ${connectionState.gameId}, player ${connectionState.playerId}, code: ${code}, reason: ${reason}`
      );
      this.connectionStates.delete(ws);
    }
  }

  // WebSocket error handler (Hibernation API)
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
    const connectionState = this.connectionStates.get(ws);
    if (connectionState) {
      console.log(
        `WebSocket error for game ${connectionState.gameId}, player ${connectionState.playerId}`
      );
      this.connectionStates.delete(ws);
    }
  }

  // Alarm handler - log connection status every 10 seconds
  async alarm(): Promise<void> {
    console.log(`GameRoom alarm: ${this.connectionStates.size} active connections`);

    // Set next alarm in 10 seconds
    const now = Date.now();
    await this.ctx.storage.setAlarm(now + 10000);
  }

  // Authenticate connection and send initial game state
  private async handleAuth(
    ws: WebSocket,
    token: string,
    connectionState: ConnectionState
  ): Promise<void> {
    try {
      // Query player from database using token
      const playerRow = await this.env.DB.prepare(
        "SELECT game_id, player_id, nickname FROM game_players WHERE token = ?"
      )
        .bind(token)
        .first<{ game_id: string; player_id: string; nickname: string }>();

      if (!playerRow) {
        this.sendMessage(ws, { type: "error", code: "INVALID_TOKEN", message: "Invalid token" });
        ws.close(1008, "Invalid token");
        this.connectionStates.delete(ws);
        return;
      }

      // Verify gameId matches
      if (playerRow.game_id !== connectionState.gameId) {
        this.sendMessage(ws, {
          type: "error",
          code: "GAME_MISMATCH",
          message: "Token does not belong to this game",
        });
        ws.close(1008, "Game mismatch");
        this.connectionStates.delete(ws);
        return;
      }

      // Update connection state
      connectionState.token = token;
      connectionState.playerId = playerRow.player_id;
      connectionState.authenticated = true;

      console.log(`Player ${playerRow.nickname} authenticated in game ${connectionState.gameId}`);

      // Get game state and send to client
      const gameState = await this.getGameState(connectionState.gameId);
      this.sendMessage(ws, {
        type: "state",
        payload: gameState,
        seq: ++this.sequenceNumber,
      });
    } catch (error) {
      console.error("Auth error:", error);
      this.sendMessage(ws, { type: "error", code: "AUTH_ERROR", message: "Authentication failed" });
      ws.close(1008, "Authentication error");
      this.connectionStates.delete(ws);
    }
  }

  // Send message to WebSocket client
  private sendMessage(ws: WebSocket, message: WsServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  // Broadcast game state to all authenticated connections for a game
  private async broadcastGameState(gameId: string): Promise<void> {
    const gameState = await this.getGameState(gameId);

    for (const [ws, state] of this.connectionStates.entries()) {
      if (state.authenticated && state.gameId === gameId) {
        this.sendMessage(ws, {
          type: "state",
          payload: gameState,
          seq: ++this.sequenceNumber,
        });
      }
    }
  }

  // Simple game state query (simplified version of getGameState from src/db/queries/game.ts)
  private async getGameState(gameId: string): Promise<any> {
    try {
      // Get basic game info
      const game = await this.env.DB.prepare(
        "SELECT id, code, status, phase, round, winner, config FROM games WHERE id = ?"
      )
        .bind(gameId)
        .first<{
          id: string;
          code: string;
          status: string;
          phase: string;
          round: number;
          winner: string | null;
          config: string;
        }>();

      if (!game) {
        return { error: "Game not found" };
      }

      // Get players
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

4. Test HTTP notification:
   curl -X POST "https://your-worker-domain.workers.dev/notify?gameId=test123"

5. Expected flow:
   - Connect -> receive auth challenge
   - Send auth message -> receive game state
   - Send ping -> receive pong
   - HTTP notify -> all authenticated clients receive updated state

6. Rate limit test:
   - Open 6+ connections to same gameId -> 6th should get 429 error
*/

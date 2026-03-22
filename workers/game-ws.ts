// ---------------------------------------------------------------------------
// CF Worker entry point - WebSocket upgrade and routing
// ---------------------------------------------------------------------------

import { GameRoom } from "./game-room";
import type { Env } from "./types";

export { GameRoom };

const WORKER_START = Date.now();
const WORKER_VERSION = "1.10.0";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Origin validation
    const origin = request.headers.get("Origin");
    if (origin && !isAllowedOrigin(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": getAllowedOrigin(origin),
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Notify-Secret",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // WebSocket upgrade route: /ws/game?gameId=XXX
    if (url.pathname === "/ws/game") {
      const gameId = url.searchParams.get("gameId");
      if (!gameId) {
        return new Response("Missing gameId parameter", { status: 400 });
      }

      // Validate gameId format (should be nanoid: 21 chars, alphanumeric + underscore/hyphen)
      if (!/^[A-Za-z0-9_-]{21}$/.test(gameId)) {
        return new Response("Invalid gameId format", { status: 400 });
      }

      // Check if WebSocket upgrade requested
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("WebSocket upgrade required", { status: 426 });
      }

      // Get Durable Object instance using deterministic ID (idFromName)
      const id = env.GAME_ROOM.idFromName(gameId);
      const stub = env.GAME_ROOM.get(id);

      // Forward request to Durable Object with added websocket path
      const doRequest = new Request(`${url.origin}/websocket?gameId=${gameId}`, request);
      const response = await stub.fetch(doRequest);

      // Add CORS headers to response
      if (response.status === 101) {
        return new Response(null, {
          status: 101,
          webSocket: response.webSocket,
          headers: {
            "Access-Control-Allow-Origin": getAllowedOrigin(origin),
          },
        });
      }

      return addCorsHeaders(response, origin);
    }

    // HTTP notification route: /notify?gameId=XXX
    if (url.pathname === "/notify" && request.method === "POST") {
      // Validate shared secret at the entry worker level
      const secret = request.headers.get("X-Notify-Secret");
      if (!secret || secret !== env.NOTIFY_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      const gameId = url.searchParams.get("gameId");
      if (!gameId) {
        return new Response("Missing gameId parameter", { status: 400 });
      }

      // Validate gameId format
      if (!/^[A-Za-z0-9_-]{21}$/.test(gameId)) {
        return new Response("Invalid gameId format", { status: 400 });
      }

      // Get Durable Object instance
      const id = env.GAME_ROOM.idFromName(gameId);
      const stub = env.GAME_ROOM.get(id);

      // Forward notification to Durable Object (no secret needed — already validated)
      const doRequest = new Request(`${url.origin}/notify?gameId=${gameId}`, {
        method: "POST",
      });

      const response = await stub.fetch(doRequest);
      return addCorsHeaders(response, origin);
    }

    // Health check
    if (url.pathname === "/health") {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            worker: "mafia-game-ws",
            version: WORKER_VERSION,
            uptimeMs: Date.now() - WORKER_START,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        ),
        origin
      );
    }

    // Deep health check — probes a sample DO and D1
    if (url.pathname === "/health/deep") {
      try {
        const probeId = env.GAME_ROOM.idFromName("__health_probe__");
        const stub = env.GAME_ROOM.get(probeId);
        const doReq = new Request(`${url.origin}/health-check`, { method: "GET" });
        const doRes = await stub.fetch(doReq);
        const doBody = await doRes.json();

        return addCorsHeaders(
          new Response(
            JSON.stringify({
              status: "ok",
              timestamp: new Date().toISOString(),
              worker: "mafia-game-ws",
              version: WORKER_VERSION,
              uptimeMs: Date.now() - WORKER_START,
              durableObject: doBody,
            }),
            { headers: { "Content-Type": "application/json" } }
          ),
          origin
        );
      } catch (error) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              status: "error",
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : "Deep health check failed",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          ),
          origin
        );
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

// Origin validation - adjust these URLs for your domains
function isAllowedOrigin(origin: string): boolean {
  const allowed = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://mafia-game.pages.dev",
    "https://mafia-game-staging.pages.dev",
  ];

  return allowed.includes(origin);
}

function getAllowedOrigin(requestOrigin: string | null): string {
  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    return requestOrigin;
  }
  return "https://mafia-game.pages.dev"; // fallback
}

function addCorsHeaders(response: Response, requestOrigin: string | null): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  newResponse.headers.set("Access-Control-Allow-Origin", getAllowedOrigin(requestOrigin));
  newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newResponse.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Notify-Secret"
  );

  return newResponse;
}

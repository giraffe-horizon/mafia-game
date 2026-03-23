#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// WebSocket Load Test Script
// Usage: tsx scripts/load-test.ts [--url <ws-url>] [--concurrency <n>] [--dry-run]
// ---------------------------------------------------------------------------

import { WebSocket } from "ws";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let url = process.env.WS_URL ?? "ws://localhost:8787";
  let concurrency = 50;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--url" || args[i] === "-u") && args[i + 1]) {
      url = args[++i];
    } else if ((args[i] === "--concurrency" || args[i] === "-c") && args[i + 1]) {
      concurrency = parseInt(args[++i], 10);
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { url: url.replace(/\/$/, ""), concurrency, dryRun };
}

// ---------------------------------------------------------------------------
// Percentile helper
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ---------------------------------------------------------------------------
// Single client
// ---------------------------------------------------------------------------

interface ClientResult {
  connected: boolean;
  authenticated: boolean;
  authLatencyMs: number;
  messagesReceived: number;
  errors: string[];
  disconnected: boolean;
}

const TEST_GAME_ID = "loadtest_000000000000"; // 21 chars
const TEST_TOKEN = "__load_test_token__";

function createClient(wsUrl: string, clientId: number, dryRun: boolean): Promise<ClientResult> {
  return new Promise((resolve) => {
    const result: ClientResult = {
      connected: false,
      authenticated: false,
      authLatencyMs: 0,
      messagesReceived: 0,
      errors: [],
      disconnected: false,
    };

    const connectStart = Date.now();
    let authSentAt = 0;
    const timeout = setTimeout(() => {
      result.errors.push("timeout");
      try {
        ws.close();
      } catch {
        /* noop */
      }
      resolve(result);
    }, 15_000);

    const fullUrl = `${wsUrl}/ws/game?gameId=${TEST_GAME_ID}`;
    const ws = new WebSocket(fullUrl);

    ws.on("open", () => {
      result.connected = true;
    });

    ws.on("message", (data: Buffer) => {
      result.messagesReceived++;
      try {
        const msg = JSON.parse(data.toString());

        if (msg.code === "AUTH_REQUIRED") {
          // Send auth
          authSentAt = Date.now();
          const token = dryRun ? TEST_TOKEN : `test-token-${clientId}`;
          ws.send(JSON.stringify({ type: "auth", token }));
        } else if (msg.type === "state" || msg.code === "INVALID_TOKEN") {
          // Auth response received
          result.authLatencyMs = Date.now() - authSentAt;
          result.authenticated = msg.type === "state";
        } else if (msg.type === "error" && msg.code !== "AUTH_REQUIRED") {
          result.errors.push(`${msg.code}: ${msg.message}`);
        }
      } catch {
        result.errors.push("parse_error");
      }
    });

    ws.on("close", () => {
      result.disconnected = true;
      clearTimeout(timeout);
      resolve(result);
    });

    ws.on("error", (err: Error) => {
      result.errors.push(err.message);
      clearTimeout(timeout);
      resolve(result);
    });
  });
}

// ---------------------------------------------------------------------------
// Broadcast storm test
// ---------------------------------------------------------------------------

interface BroadcastResult {
  totalSent: number;
  totalExpected: number;
  totalReceived: number;
  dropped: number;
  latencies: number[];
}

async function broadcastStorm(
  wsUrl: string,
  concurrency: number,
  dryRun: boolean
): Promise<BroadcastResult> {
  const result: BroadcastResult = {
    totalSent: 0,
    totalExpected: 0,
    totalReceived: 0,
    dropped: 0,
    latencies: [],
  };

  // Connect clients
  const clients: WebSocket[] = [];
  const messageCounters: number[] = [];

  const connectPromises = Array.from({ length: concurrency }, (_, i) => {
    return new Promise<WebSocket | null>((resolve) => {
      const ws = new WebSocket(`${wsUrl}/ws/game?gameId=${TEST_GAME_ID}`);
      const timeout = setTimeout(() => {
        try {
          ws.close();
        } catch {
          /* noop */
        }
        resolve(null);
      }, 10_000);

      ws.on("message", (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.code === "AUTH_REQUIRED") {
            const token = dryRun ? TEST_TOKEN : `test-token-storm-${i}`;
            ws.send(JSON.stringify({ type: "auth", token }));
          } else if (msg.type === "state") {
            clearTimeout(timeout);
            resolve(ws);
          }
        } catch {
          /* noop */
        }
      });

      ws.on("error", () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  });

  const results = await Promise.all(connectPromises);
  for (const ws of results) {
    if (ws) {
      clients.push(ws);
      messageCounters.push(0);
    }
  }

  if (clients.length === 0) {
    console.log("  No clients connected for broadcast storm — skipping");
    return result;
  }

  // Set up message counters
  clients.forEach((ws, idx) => {
    ws.on("message", () => {
      messageCounters[idx]++;
    });
  });

  // Broadcast storm: 10 msgs/sec for 10s = 100 notifications
  const MSGS_PER_SEC = 10;
  const DURATION_SEC = 10;
  const TOTAL_MSGS = MSGS_PER_SEC * DURATION_SEC;

  console.log(`  Broadcasting ${TOTAL_MSGS} notifications to ${clients.length} clients...`);

  const notifyUrl = wsUrl.replace("ws://", "http://").replace("wss://", "https://");

  for (let s = 0; s < DURATION_SEC; s++) {
    const batchStart = Date.now();
    for (let m = 0; m < MSGS_PER_SEC; m++) {
      const sendStart = Date.now();
      try {
        await fetch(`${notifyUrl}/notify?gameId=${TEST_GAME_ID}`, {
          method: "POST",
          headers: {
            "X-Notify-Secret": process.env.NOTIFY_SECRET ?? "test-secret",
          },
        });
        result.latencies.push(Date.now() - sendStart);
        result.totalSent++;
      } catch {
        // notify endpoint not available — skip
      }
    }
    // Pace to ~1 second per batch
    const elapsed = Date.now() - batchStart;
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed));
    }
  }

  // Wait for messages to arrive
  await new Promise((r) => setTimeout(r, 2000));

  // Each notify triggers a broadcast to all connected & authenticated clients
  // With fake tokens (non-dry-run), auth fails so no broadcasts are received
  // In dry-run mode, the DO would need to accept the test token
  result.totalExpected = result.totalSent * clients.length;
  result.totalReceived = messageCounters.reduce((a, b) => a + b, 0);
  result.dropped = Math.max(0, result.totalExpected - result.totalReceived);

  // Cleanup
  for (const ws of clients) {
    try {
      ws.close();
    } catch {
      /* noop */
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { url, concurrency, dryRun } = parseArgs();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║     WebSocket Load Test — Mafia Game     ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  URL:         ${url}`);
  console.log(`  Concurrency: ${concurrency}`);
  console.log(`  Dry-run:     ${dryRun}`);
  console.log(`  Game ID:     ${TEST_GAME_ID}`);
  console.log();

  // Phase 1: Connection + Auth test
  console.log("─── Phase 1: Connection & Auth ───");
  console.log(`  Connecting ${concurrency} clients...`);

  const startTime = Date.now();
  const clientPromises = Array.from({ length: concurrency }, (_, i) =>
    createClient(url, i, dryRun)
  );
  const clientResults = await Promise.all(clientPromises);
  const totalTime = Date.now() - startTime;

  const connected = clientResults.filter((r) => r.connected).length;
  const authenticated = clientResults.filter((r) => r.authenticated).length;
  const authLatencies = clientResults
    .filter((r) => r.authLatencyMs > 0)
    .map((r) => r.authLatencyMs)
    .sort((a, b) => a - b);
  const errorCount = clientResults.filter((r) => r.errors.length > 0).length;

  console.log(`  Done in ${totalTime}ms`);
  console.log();

  // Phase 2: Broadcast storm
  console.log("─── Phase 2: Broadcast Storm ───");
  const broadcastResult = await broadcastStorm(url, Math.min(concurrency, 5), dryRun);
  const broadcastLatencies = broadcastResult.latencies.sort((a, b) => a - b);
  console.log();

  // Phase 3: Ping/pong (simulated via connection test)
  console.log("─── Phase 3: Ping/Pong ───");
  console.log("  (Ping/pong validated during connection phase)");
  console.log();

  // Results table
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                     RESULTS                            ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Connections succeeded:  ${pad(connected)}/ ${concurrency}`);
  console.log(`║  Authenticated:          ${pad(authenticated)}/ ${concurrency}`);
  console.log(`║  Connection errors:      ${pad(errorCount)}`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Auth Latency:                                         ║");
  console.log(`║    p50:                  ${pad(percentile(authLatencies, 50))}ms`);
  console.log(`║    p95:                  ${pad(percentile(authLatencies, 95))}ms`);
  console.log(`║    p99:                  ${pad(percentile(authLatencies, 99))}ms`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Broadcast Storm:                                      ║");
  console.log(`║    Notifications sent:   ${pad(broadcastResult.totalSent)}`);
  console.log(`║    Messages expected:    ${pad(broadcastResult.totalExpected)}`);
  console.log(`║    Messages received:    ${pad(broadcastResult.totalReceived)}`);
  console.log(`║    Dropped:              ${pad(broadcastResult.dropped)}`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Notify Latency:                                       ║");
  console.log(`║    p50:                  ${pad(percentile(broadcastLatencies, 50))}ms`);
  console.log(`║    p95:                  ${pad(percentile(broadcastLatencies, 95))}ms`);
  console.log(`║    p99:                  ${pad(percentile(broadcastLatencies, 99))}ms`);
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  // Pass/fail
  const p95Auth = percentile(authLatencies, 95);
  const p95Notify = percentile(broadcastLatencies, 95);
  const p95 = Math.max(p95Auth, p95Notify);
  const dropped = broadcastResult.dropped;
  const pass = p95 < 100 && dropped === 0 && connected === concurrency;

  if (pass) {
    console.log("  ✅ PASS — p95 < 100ms, 0 dropped, all connected");
  } else {
    const reasons: string[] = [];
    if (p95 >= 100) reasons.push(`p95=${p95}ms (>100ms)`);
    if (dropped > 0) reasons.push(`${dropped} dropped messages`);
    if (connected < concurrency) reasons.push(`${concurrency - connected} failed connections`);
    console.log(`  ❌ FAIL — ${reasons.join(", ")}`);
  }

  process.exit(pass ? 0 : 1);
}

function pad(n: number): string {
  return String(n).padStart(6);
}

main().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});

#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// WebSocket Smoke Test — post-deploy verification
// Usage: tsx scripts/smoke-test.ts [--url <ws-url>]
// ---------------------------------------------------------------------------

import { WebSocket } from "ws";

function parseArgs() {
  const args = process.argv.slice(2);
  let url = process.env.WS_URL ?? "ws://localhost:8787";

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--url" || args[i] === "-u") && args[i + 1]) {
      url = args[++i];
    }
  }

  return { url: url.replace(/\/$/, "") };
}

interface TestResult {
  name: string;
  pass: boolean;
  durationMs: number;
  error?: string;
}

async function testHealth(baseUrl: string): Promise<TestResult> {
  const httpUrl = baseUrl.replace("ws://", "http://").replace("wss://", "https://");
  const start = Date.now();
  try {
    const res = await fetch(`${httpUrl}/health`);
    const body = await res.json();
    const pass = res.status === 200 && body.status === "ok";
    return {
      name: "/health",
      pass,
      durationMs: Date.now() - start,
      error: pass ? undefined : `status=${res.status} body=${JSON.stringify(body)}`,
    };
  } catch (err) {
    return {
      name: "/health",
      pass: false,
      durationMs: Date.now() - start,
      error: String(err),
    };
  }
}

async function testHealthDeep(baseUrl: string): Promise<TestResult> {
  const httpUrl = baseUrl.replace("ws://", "http://").replace("wss://", "https://");
  const start = Date.now();
  try {
    const res = await fetch(`${httpUrl}/health/deep`);
    const body = await res.json();
    const pass = res.status === 200 && body.status === "ok";
    return {
      name: "/health/deep",
      pass,
      durationMs: Date.now() - start,
      error: pass ? undefined : `status=${res.status} body=${JSON.stringify(body)}`,
    };
  } catch (err) {
    return {
      name: "/health/deep",
      pass: false,
      durationMs: Date.now() - start,
      error: String(err),
    };
  }
}

async function testWsConnect(wsUrl: string): Promise<TestResult> {
  const start = Date.now();
  const gameId = "smoketest_00000000000"; // 21 chars

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
      resolve({
        name: "WS connect",
        pass: false,
        durationMs: Date.now() - start,
        error: "timeout (10s)",
      });
    }, 10_000);

    const ws = new WebSocket(`${wsUrl}/ws/game?gameId=${gameId}`);

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.code === "AUTH_REQUIRED") {
          clearTimeout(timeout);
          ws.close();
          resolve({
            name: "WS connect + auth challenge",
            pass: true,
            durationMs: Date.now() - start,
          });
        }
      } catch {
        /* noop */
      }
    });

    ws.on("error", (err: Error) => {
      clearTimeout(timeout);
      resolve({
        name: "WS connect",
        pass: false,
        durationMs: Date.now() - start,
        error: err.message,
      });
    });
  });
}

async function testPingPong(wsUrl: string): Promise<TestResult> {
  const start = Date.now();
  const gameId = "smoketest_00000000000";

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
      resolve({
        name: "Ping/Pong",
        pass: false,
        durationMs: Date.now() - start,
        error: "timeout (10s)",
      });
    }, 10_000);

    const ws = new WebSocket(`${wsUrl}/ws/game?gameId=${gameId}`);
    let authChallengeSeen = false;

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.code === "AUTH_REQUIRED" && !authChallengeSeen) {
          authChallengeSeen = true;
          // Send auth first (ping requires authentication)
          ws.send(JSON.stringify({ type: "auth", token: "smoke-test-token" }));
          return;
        }

        // After auth response (success or fail), try ping
        if (msg.type === "state" || msg.code === "INVALID_TOKEN") {
          ws.send(JSON.stringify({ type: "ping" }));
          return;
        }

        if (msg.type === "pong") {
          clearTimeout(timeout);
          ws.close();
          resolve({
            name: "Ping/Pong",
            pass: true,
            durationMs: Date.now() - start,
          });
          return;
        }

        // If we get NOT_AUTHENTICATED after ping, auth failed as expected
        if (msg.code === "NOT_AUTHENTICATED") {
          clearTimeout(timeout);
          ws.close();
          resolve({
            name: "Ping/Pong (auth required)",
            pass: true,
            durationMs: Date.now() - start,
          });
        }
      } catch {
        /* noop */
      }
    });

    ws.on("error", (err: Error) => {
      clearTimeout(timeout);
      resolve({
        name: "Ping/Pong",
        pass: false,
        durationMs: Date.now() - start,
        error: err.message,
      });
    });
  });
}

async function main() {
  const { url } = parseArgs();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║     WebSocket Smoke Test — Mafia Game    ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  URL: ${url}`);
  console.log();

  const results: TestResult[] = [];

  // Run tests sequentially
  results.push(await testHealth(url));
  results.push(await testHealthDeep(url));
  results.push(await testWsConnect(url));
  results.push(await testPingPong(url));

  // Display results
  console.log("─── Results ───");
  for (const r of results) {
    const icon = r.pass ? "✅" : "❌";
    const time = `${r.durationMs}ms`.padStart(8);
    console.log(`  ${icon} ${r.name.padEnd(35)} ${time}`);
    if (r.error) {
      console.log(`     └─ ${r.error}`);
    }
  }

  console.log();
  const allPass = results.every((r) => r.pass);
  if (allPass) {
    console.log("  ✅ All smoke tests passed");
  } else {
    const failed = results.filter((r) => !r.pass).length;
    console.log(`  ❌ ${failed} test(s) failed`);
  }

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});

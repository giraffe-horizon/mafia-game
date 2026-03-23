#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Auto-Rollback Script — monitors CF Workers analytics, rolls back on errors
// Usage: tsx scripts/auto-rollback.ts [--check-interval <seconds>] [--threshold <percent>]
//
// Env vars:
//   CF_API_TOKEN    — Cloudflare API token (Workers read + edit)
//   CF_ACCOUNT_ID   — Cloudflare account ID
//   CF_WORKER_NAME  — Worker name (default: mafia-game-ws)
// ---------------------------------------------------------------------------

interface AnalyticsRow {
  sum: {
    requests: number;
    errors: number;
  };
  quantiles: {
    cpuTimeP50: number;
    cpuTimeP95: number;
    cpuTimeP99: number;
  };
  dimensions: {
    datetime: string;
  };
}

interface GraphQLResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        workersAnalyticsAdaptiveGroups?: AnalyticsRow[];
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

function getEnvOrDie(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return val;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let checkInterval = 30; // seconds
  let threshold = 5; // percent
  let once = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--check-interval" && args[i + 1]) {
      checkInterval = parseInt(args[++i], 10);
    } else if (args[i] === "--threshold" && args[i + 1]) {
      threshold = parseFloat(args[++i]);
    } else if (args[i] === "--once") {
      once = true;
    }
  }

  return { checkInterval, threshold, once };
}

async function fetchAnalytics(
  apiToken: string,
  accountId: string,
  workerName: string,
  sinceMinutes: number
): Promise<{ requests: number; errors: number; errorRate: number; p95CpuMs: number }> {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
  const until = new Date().toISOString();

  const query = `
    query {
      viewer {
        accounts(filter: { accountTag: "${accountId}" }) {
          workersAnalyticsAdaptiveGroups(
            limit: 1
            filter: {
              scriptName: "${workerName}"
              datetime_geq: "${since}"
              datetime_leq: "${until}"
            }
          ) {
            sum {
              requests
              errors
            }
            quantiles {
              cpuTimeP50
              cpuTimeP95
              cpuTimeP99
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const body = (await res.json()) as GraphQLResponse;

  if (body.errors?.length) {
    throw new Error(`GraphQL error: ${body.errors.map((e) => e.message).join(", ")}`);
  }

  const groups = body.data?.viewer?.accounts?.[0]?.workersAnalyticsAdaptiveGroups ?? [];

  if (groups.length === 0) {
    return { requests: 0, errors: 0, errorRate: 0, p95CpuMs: 0 };
  }

  const row = groups[0];
  const requests = row.sum.requests;
  const errors = row.sum.errors;
  const errorRate = requests > 0 ? (errors / requests) * 100 : 0;

  return {
    requests,
    errors,
    errorRate,
    p95CpuMs: row.quantiles.cpuTimeP95,
  };
}

async function rollbackWorker(
  apiToken: string,
  accountId: string,
  workerName: string
): Promise<boolean> {
  console.log(`[rollback] Rolling back ${workerName}...`);

  // Use Cloudflare API to rollback to previous version
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/deployments/rollback`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Auto-rollback: error rate exceeded threshold" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[rollback] Failed (${res.status}): ${text}`);
    return false;
  }

  console.log(`[rollback] Successfully rolled back ${workerName}`);
  return true;
}

async function main() {
  const { checkInterval, threshold, once } = parseArgs();
  const apiToken = getEnvOrDie("CF_API_TOKEN");
  const accountId = getEnvOrDie("CF_ACCOUNT_ID");
  const workerName = getEnvOrDie("CF_WORKER_NAME", "mafia-game-ws");

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Auto-Rollback Monitor — Mafia Game WS  ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  Worker:          ${workerName}`);
  console.log(`  Check interval:  ${checkInterval}s`);
  console.log(`  Error threshold: ${threshold}%`);
  console.log(`  Mode:            ${once ? "single check" : "continuous"}`);
  console.log();

  let consecutiveBreaches = 0;
  const BREACH_WINDOW = 2; // minutes — 2 consecutive checks needed

  const check = async () => {
    try {
      const stats = await fetchAnalytics(apiToken, accountId, workerName, 2);

      const ts = new Date().toISOString();
      console.log(
        `[${ts}] requests=${stats.requests} errors=${stats.errors} ` +
          `errorRate=${stats.errorRate.toFixed(2)}% p95cpu=${stats.p95CpuMs}ms`
      );

      if (stats.errorRate > threshold && stats.requests > 10) {
        consecutiveBreaches++;
        console.log(
          `[warn] Error rate ${stats.errorRate.toFixed(2)}% > ${threshold}% ` +
            `(breach ${consecutiveBreaches}/${BREACH_WINDOW})`
        );

        if (consecutiveBreaches >= BREACH_WINDOW) {
          const ok = await rollbackWorker(apiToken, accountId, workerName);
          if (ok) {
            console.log("[done] Rollback complete — exiting");
            process.exit(0);
          } else {
            console.error("[error] Rollback failed — continuing monitoring");
            consecutiveBreaches = 0;
          }
        }
      } else {
        if (consecutiveBreaches > 0) {
          console.log("[info] Error rate back to normal — resetting breach counter");
        }
        consecutiveBreaches = 0;
      }
    } catch (err) {
      console.error("[error] Analytics check failed:", err);
    }
  };

  await check();

  if (!once) {
    setInterval(check, checkInterval * 1000);
    console.log(`[info] Monitoring... (Ctrl+C to stop)`);
  }
}

main().catch((err) => {
  console.error("Auto-rollback script failed:", err);
  process.exit(1);
});

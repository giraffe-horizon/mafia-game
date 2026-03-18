#!/usr/bin/env tsx
/**
 * Seed a mafia game to a specific phase for testing.
 *
 * Usage:
 *   pnpm seed                          # default: 5 players, lobby stage
 *   STAGE=night PLAYERS=7 pnpm seed    # 7 players, night phase
 *   STAGE=ended pnpm seed              # play through to end
 *
 * Environment variables:
 *   STAGE:       lobby | night | day | voting | ended (default: lobby)
 *   PLAYERS:     number of players, 3-12 (default: 5)
 *   BASE_URL:    API base URL (default: http://localhost:3000)
 *   MODE:        full | simple (default: full)
 *   MAFIA_COUNT: number of mafia (default: auto)
 */

const STAGE = (process.env.STAGE || "lobby") as "lobby" | "night" | "day" | "voting" | "ended";
const PLAYERS = Math.min(Math.max(parseInt(process.env.PLAYERS || "5", 10), 3), 12);
const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const MODE = (process.env.MODE || "full") as "full" | "simple";
const MAFIA_COUNT = process.env.MAFIA_COUNT ? parseInt(process.env.MAFIA_COUNT, 10) : undefined;

interface SeedResult {
  stage: string;
  gameCode: string;
  gmToken: string;
  players: { nickname: string; token: string; role: string | null }[];
}

async function main() {
  console.log(`\nSeeding game via ${BASE_URL}/api/dev/seed ...`);
  console.log(
    `  Stage: ${STAGE}, Players: ${PLAYERS}, Mode: ${MODE}${MAFIA_COUNT ? `, Mafia: ${MAFIA_COUNT}` : ""}\n`
  );

  const res = await fetch(`${BASE_URL}/api/dev/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stage: STAGE,
      players: PLAYERS,
      mode: MODE,
      mafiaCount: MAFIA_COUNT,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`\x1b[31mSeed failed (${res.status}):\x1b[0m`, err);
    process.exit(1);
  }

  const result: SeedResult = await res.json();
  const ROLE_LABELS: Record<string, string> = {
    mafia: "Mafia",
    detective: "Policjant",
    doctor: "Lekarz",
    civilian: "Cywil",
  };

  console.log(`\x1b[32m🎮 Game seeded to: ${result.stage}\x1b[0m`);
  console.log(`📋 Code: ${result.gameCode}`);
  console.log(`👑 GM: ${BASE_URL}/game/${result.gmToken}`);
  console.log(`🎭 Players:`);
  for (const p of result.players) {
    const roleLabel = p.role ? ROLE_LABELS[p.role] || p.role : "—";
    console.log(`   ${p.nickname} (${roleLabel}): ${BASE_URL}/game/${p.token}`);
  }
  console.log();
}

main().catch((err) => {
  console.error("\x1b[31mSeed error:\x1b[0m", err.message || err);
  process.exit(1);
});

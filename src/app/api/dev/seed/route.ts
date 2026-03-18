import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/api/lib/db";
import {
  createGame,
  joinGame,
  setupPlayer,
  startGame,
  changePhase,
  submitAction,
  getCharacters,
  getGameState,
} from "@/db";
import type { D1Database, Role } from "@/db/types";

export const dynamic = "force-dynamic";

type SeedStage = "lobby" | "night" | "day" | "voting" | "ended";

interface SeedRequest {
  stage?: SeedStage;
  players?: number;
  mode?: "full" | "simple";
  mafiaCount?: number;
}

interface PlayerInfo {
  nickname: string;
  token: string;
  role: Role | null;
}

interface SeedResult {
  stage: SeedStage;
  gameCode: string;
  gmToken: string;
  players: PlayerInfo[];
}

const NICKNAMES = [
  "Ania",
  "Bartek",
  "Celina",
  "Dawid",
  "Emil",
  "Felicja",
  "Grzegorz",
  "Hanna",
  "Igor",
  "Julia",
  "Kamil",
  "Laura",
];

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(null, { status: 404 });
  }

  const body = (await req.json()) as SeedRequest;
  const stage: SeedStage = body.stage || "lobby";
  const playerCount = Math.min(Math.max(body.players || 5, 3), 12);
  const mode = body.mode || "full";
  const mafiaCount = body.mafiaCount;

  try {
    const db = await getDb();
    const result = await seedGame(db, { stage, playerCount, mode, mafiaCount });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}

async function seedGame(
  db: D1Database,
  opts: {
    stage: SeedStage;
    playerCount: number;
    mode: "full" | "simple";
    mafiaCount?: number;
  }
): Promise<SeedResult> {
  const { stage, playerCount, mode, mafiaCount } = opts;

  // 1. Get available characters
  const characters = await getCharacters(db);

  // 2. Create game
  const createResult = await createGame(db);
  if (!createResult.success || !createResult.gameCode || !createResult.hostToken) {
    throw new Error(`Failed to create game: ${createResult.error}`);
  }
  const { gameCode, hostToken: gmToken } = createResult;

  // 3. Join players
  const playerTokens: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const joinResult = await joinGame(db, gameCode);
    if (!joinResult?.success || !joinResult.token) {
      throw new Error(`Failed to join player ${i}: ${joinResult?.error}`);
    }
    playerTokens.push(joinResult.token);
  }

  // 4. Setup players with nicknames and characters
  for (let i = 0; i < playerTokens.length; i++) {
    const nickname = NICKNAMES[i] || `Gracz${i + 1}`;
    const characterId = characters[i % characters.length]?.id;
    if (characterId) {
      await setupPlayer(db, playerTokens[i], nickname, characterId);
    }
  }

  if (stage === "lobby") {
    return buildResult(db, stage, gameCode, gmToken, playerTokens);
  }

  // 5. Start game
  const startResult = await startGame(db, gmToken, mafiaCount, mode);
  if (!startResult.success) {
    throw new Error(`Failed to start game: ${startResult.error}`);
  }

  if (stage === "night") {
    return buildResult(db, stage, gameCode, gmToken, playerTokens);
  }

  // 6. Play night (submit all actions, advance to day)
  await playNight(db, gmToken, playerTokens);

  if (stage === "day") {
    return buildResult(db, stage, gameCode, gmToken, playerTokens);
  }

  // 7. Advance to voting
  const votePhaseResult = await changePhase(db, gmToken, "voting");
  if (!votePhaseResult.success) {
    throw new Error(`Failed to advance to voting: ${votePhaseResult.error}`);
  }

  if (stage === "voting") {
    return buildResult(db, stage, gameCode, gmToken, playerTokens);
  }

  // 8. Play voting and keep going until game ends
  await playUntilEnd(db, gmToken, playerTokens);

  return buildResult(db, stage, gameCode, gmToken, playerTokens);
}

async function playNight(db: D1Database, gmToken: string, playerTokens: string[]): Promise<void> {
  // Get game state to know roles
  const state = await getGameState(db, gmToken);
  if (!state) throw new Error("Failed to get game state");

  const alivePlayers = state.players.filter((p) => !p.isHost && p.isAlive);
  const firstNonMafiaTarget = alivePlayers.find((p) => p.role !== "mafia");

  for (const player of alivePlayers) {
    const role = player.role;
    if (!role) continue;

    // Find a valid target (not self, not GM, alive)
    const validTargets = alivePlayers.filter((t) => t.playerId !== player.playerId);
    if (validTargets.length === 0) continue;

    switch (role) {
      case "mafia": {
        // All mafia vote for the same target (first non-mafia) for unanimity
        const target = firstNonMafiaTarget || validTargets[0];
        await submitAction(db, gmToken, "kill", target.playerId, player.playerId);
        break;
      }
      case "detective": {
        const target = validTargets[0];
        await submitAction(db, gmToken, "investigate", target.playerId, player.playerId);
        break;
      }
      case "doctor": {
        // Protect a random non-target player (not the mafia kill target to let kills happen)
        const protectTarget =
          validTargets.find((t) => t.playerId !== firstNonMafiaTarget?.playerId) || validTargets[0];
        await submitAction(db, gmToken, "protect", protectTarget.playerId, player.playerId);
        break;
      }
      case "civilian": {
        await submitAction(db, gmToken, "wait", undefined, player.playerId);
        break;
      }
    }
  }

  // Advance to day
  const dayResult = await changePhase(db, gmToken, "day");
  if (!dayResult.success) {
    throw new Error(`Failed to advance to day: ${dayResult.error}`);
  }
}

async function playVoting(db: D1Database, gmToken: string): Promise<void> {
  const state = await getGameState(db, gmToken);
  if (!state) throw new Error("Failed to get game state");

  const alivePlayers = state.players.filter((p) => !p.isHost && p.isAlive);
  if (alivePlayers.length === 0) return;

  // Everyone votes for the first alive player (deterministic)
  const voteTarget = alivePlayers[0];
  for (const player of alivePlayers) {
    await submitAction(db, gmToken, "vote", voteTarget.playerId, player.playerId);
  }
}

async function playUntilEnd(
  db: D1Database,
  gmToken: string,
  _playerTokens: string[]
): Promise<void> {
  // Play voting in current phase
  await playVoting(db, gmToken);

  // Try to advance — might end the game or go to next night
  let maxIterations = 20;
  while (maxIterations-- > 0) {
    const state = await getGameState(db, gmToken);
    if (!state) throw new Error("Failed to get game state");

    const { phase, status } = state.game;

    if (status === "finished" || phase === "ended" || phase === "review") {
      // If in review, finalize
      if (phase === "review") {
        // Mark all unrated missions as 0 points so we can finalize
        const { finalizeGame } = await import("@/db");
        await finalizeGame(db, gmToken);
      }
      return;
    }

    if (phase === "voting") {
      await playVoting(db, gmToken);
      const advResult = await changePhase(db, gmToken, "night");
      if (!advResult.success) {
        // Game might have ended
        return;
      }
    } else if (phase === "night") {
      // Get fresh tokens from state
      await playNightFromState(db, gmToken);
      // Advance to day (but changePhase to day)
    } else if (phase === "day") {
      const advResult = await changePhase(db, gmToken, "voting");
      if (!advResult.success) return;
    } else {
      return;
    }
  }
}

async function playNightFromState(db: D1Database, gmToken: string): Promise<void> {
  const state = await getGameState(db, gmToken);
  if (!state) throw new Error("Failed to get game state");

  const alivePlayers = state.players.filter((p) => !p.isHost && p.isAlive);
  const firstNonMafiaTarget = alivePlayers.find((p) => p.role !== "mafia");

  for (const player of alivePlayers) {
    const role = player.role;
    if (!role) continue;

    const validTargets = alivePlayers.filter((t) => t.playerId !== player.playerId);
    if (validTargets.length === 0) continue;

    switch (role) {
      case "mafia": {
        const target = firstNonMafiaTarget || validTargets[0];
        await submitAction(db, gmToken, "kill", target.playerId, player.playerId);
        break;
      }
      case "detective": {
        await submitAction(db, gmToken, "investigate", validTargets[0].playerId, player.playerId);
        break;
      }
      case "doctor": {
        const protectTarget =
          validTargets.find((t) => t.playerId !== firstNonMafiaTarget?.playerId) || validTargets[0];
        await submitAction(db, gmToken, "protect", protectTarget.playerId, player.playerId);
        break;
      }
      case "civilian": {
        await submitAction(db, gmToken, "wait", undefined, player.playerId);
        break;
      }
    }
  }

  const dayResult = await changePhase(db, gmToken, "day");
  if (!dayResult.success) {
    // Game may have ended during night resolution
    return;
  }
}

async function buildResult(
  db: D1Database,
  stage: SeedStage,
  gameCode: string,
  gmToken: string,
  playerTokens: string[]
): Promise<SeedResult> {
  // Get final state from GM perspective to get roles
  const state = await getGameState(db, gmToken);
  const players: PlayerInfo[] = [];

  if (state) {
    for (let i = 0; i < playerTokens.length; i++) {
      const statePlayer = state.players.find((p) => !p.isHost && p.nickname === NICKNAMES[i]);
      players.push({
        nickname: statePlayer?.nickname || NICKNAMES[i] || `Gracz${i + 1}`,
        token: playerTokens[i],
        role: statePlayer?.role || null,
      });
    }
  }

  return { stage, gameCode, gmToken, players };
}

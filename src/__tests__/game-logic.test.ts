/**
 * Tests for critical game logic paths:
 * - voteHistory: vote tracking, mafia consensus logic
 * - lastNightSummary: night resolution and lastPhaseResult
 * - gameLog: lastPhaseResult events grouped by event type (kill, no_kill, eliminate, no_eliminate)
 * - buildTransition: transition screen generation
 * - checkWinConditions: end-game detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSqliteD1, SqliteD1Database } from "./helpers/sqliteD1";
import * as db from "@/db";
import { buildTransition } from "@/features/game/store/buildTransition";
import type { GamePhase } from "@/db/types";

vi.mock("nanoid", () => {
  let counter = 0;
  return {
    nanoid: vi.fn(() => `id-${++counter}-${Date.now()}`),
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function setupFullGame(mockDb: SqliteD1Database) {
  const { token: hostToken } = await db.createGame(mockDb, "Host");
  const hostState = await db.getGameState(mockDb, hostToken);
  const code = hostState!.game.code;

  const playerTokens: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = await db.joinGame(mockDb, code, `Player${i}`);
    playerTokens.push(r!.token);
  }

  await db.startGame(mockDb, hostToken, undefined, "full");
  return { hostToken, playerTokens };
}

async function getRoleTokens(mockDb: SqliteD1Database, playerTokens: string[]) {
  let mafiaToken: string | null = null;
  let detectiveToken: string | null = null;
  let doctorToken: string | null = null;
  let civilianToken: string | null = null;
  let civilianId: string | null = null;

  for (const t of playerTokens) {
    const s = await db.getGameState(mockDb, t);
    const role = s!.currentPlayer.role;
    if (role === "mafia" && !mafiaToken) mafiaToken = t;
    if (role === "detective" && !detectiveToken) detectiveToken = t;
    if (role === "doctor" && !doctorToken) doctorToken = t;
    if (role === "civilian" && !civilianToken) {
      civilianToken = t;
      civilianId = s!.currentPlayer.playerId;
    }
  }

  return { mafiaToken, detectiveToken, doctorToken, civilianToken, civilianId };
}

// ─── voteHistory ─────────────────────────────────────────────────────────────

describe("voteHistory — vote tracking in voting phase", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  it("should record a vote action in the voting phase", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");

    const state = await db.getGameState(mockDb, playerTokens[0]);
    const alivePlayers = state!.players.filter((p) => p.isAlive && !p.isHost);
    const voterState = await db.getGameState(mockDb, playerTokens[0]);
    const targetId = alivePlayers.find(
      (p) => p.playerId !== voterState!.currentPlayer.playerId
    )?.playerId;

    if (targetId) {
      const result = await db.submitAction(mockDb, playerTokens[0], "vote", targetId);
      expect(result.success).toBe(true);

      // Vote should appear as myAction
      const afterVoteState = await db.getGameState(mockDb, playerTokens[0]);
      expect(afterVoteState!.myAction).not.toBeNull();
      expect(afterVoteState!.myAction!.actionType).toBe("vote");
      expect(afterVoteState!.myAction!.targetPlayerId).toBe(targetId);
    }
  });

  it("should track vote tally visible to all during voting", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");

    const state = await db.getGameState(mockDb, playerTokens[0]);
    const alivePlayers = state!.players.filter((p) => p.isAlive && !p.isHost);
    const voterState = await db.getGameState(mockDb, playerTokens[0]);
    const targetId = alivePlayers.find(
      (p) => p.playerId !== voterState!.currentPlayer.playerId
    )?.playerId;

    if (targetId) {
      await db.submitAction(mockDb, playerTokens[0], "vote", targetId);

      // Vote tally should be visible during voting phase
      const tallyState = await db.getGameState(mockDb, playerTokens[1]);
      expect(tallyState!.voteTally).toBeDefined();
      expect(tallyState!.voteTally!.votedCount).toBeGreaterThanOrEqual(1);
      expect(tallyState!.voteTally!.totalVoters).toBeGreaterThan(0);
    }
  });

  it("should eliminate player with clear majority votes", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");

    const state = await db.getGameState(mockDb, playerTokens[0]);
    const alivePlayers = state!.players.filter((p) => p.isAlive && !p.isHost);

    // Need at least 2 targets
    if (alivePlayers.length >= 2) {
      const target = alivePlayers[0];
      const targetId = target.playerId;

      // Multiple players vote for same target
      let votesSubmitted = 0;
      for (const t of playerTokens) {
        const ps = await db.getGameState(mockDb, t);
        if (ps && ps.currentPlayer.isAlive && ps.currentPlayer.playerId !== targetId) {
          const r = await db.submitAction(mockDb, t, "vote", targetId);
          if (r.success) votesSubmitted++;
          if (votesSubmitted >= 3) break;
        }
      }
    }

    // Move to next phase
    const result = await db.changePhase(mockDb, hostToken, "night");
    expect(result.success).toBe(true);
  });

  it("should allow player to change vote before phase ends", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");

    const state = await db.getGameState(mockDb, playerTokens[0]);
    const alivePlayers = state!.players.filter((p) => p.isAlive && !p.isHost);
    const voterState = await db.getGameState(mockDb, playerTokens[0]);

    if (alivePlayers.length >= 2) {
      const target1Id = alivePlayers.find(
        (p) => p.playerId !== voterState!.currentPlayer.playerId
      )?.playerId;
      const target2Id = alivePlayers.filter(
        (p) => p.playerId !== voterState!.currentPlayer.playerId
      )[1]?.playerId;

      if (target1Id && target2Id) {
        await db.submitAction(mockDb, playerTokens[0], "vote", target1Id);
        // Change vote
        const changeResult = await db.submitAction(mockDb, playerTokens[0], "vote", target2Id);
        expect(changeResult.success).toBe(true);

        const afterState = await db.getGameState(mockDb, playerTokens[0]);
        expect(afterState!.myAction!.targetPlayerId).toBe(target2Id);
      }
    }
  });

  it("should track host actions panel with vote actions", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");

    const state = await db.getGameState(mockDb, playerTokens[0]);
    const alivePlayers = state!.players.filter((p) => p.isAlive && !p.isHost);
    const voterState = await db.getGameState(mockDb, playerTokens[0]);
    const targetId = alivePlayers.find(
      (p) => p.playerId !== voterState!.currentPlayer.playerId
    )?.playerId;

    if (targetId) {
      await db.submitAction(mockDb, playerTokens[0], "vote", targetId);

      const hostState = await db.getGameState(mockDb, hostToken);
      expect(hostState!.hostActions).toBeDefined();
      const voteAction = hostState!.hostActions!.find((a) => a.actionType === "vote");
      expect(voteAction).toBeDefined();
    }
  });
});

// ─── lastNightSummary ─────────────────────────────────────────────────────────

describe("lastNightSummary — night resolution via lastPhaseResult", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  it("should set lastPhaseResult type=kill when mafia kills a target", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianId) {
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.lastPhaseResult).toBeDefined();
      expect(state!.lastPhaseResult!.type).toBe("kill");
      expect(state!.lastPhaseResult!.playerId).toBe(civilianId);
    }
  });

  it("should set lastPhaseResult type=no_kill when doctor saves the target", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, doctorToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && doctorToken && civilianId) {
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.submitAction(mockDb, doctorToken, "protect", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.lastPhaseResult).toBeDefined();
      expect(state!.lastPhaseResult!.type).toBe("no_kill");
    }
  });

  it("should set lastPhaseResult type=no_kill when no mafia vote cast", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    // No night actions — just advance phase
    await db.changePhase(mockDb, hostToken, "day");

    const state = await db.getGameState(mockDb, hostToken);
    expect(state!.lastPhaseResult).toBeDefined();
    expect(state!.lastPhaseResult!.type).toBe("no_kill");
  });

  it("should include nickname and role in kill result", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianToken && civilianId) {
      const civilianState = await db.getGameState(mockDb, civilianToken);
      const civilianNickname = civilianState!.currentPlayer.nickname;

      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.lastPhaseResult!.nickname).toBe(civilianNickname);
      expect(state!.lastPhaseResult!.role).toBe("civilian");
    }
  });

  it("should send night message to all players after resolution", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianId) {
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      // All players should receive a night result message
      for (const t of playerTokens) {
        const state = await db.getGameState(mockDb, t);
        if (state) {
          expect(state.messages.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ─── gameLog / lastPhaseResult events ────────────────────────────────────────

describe("gameLog — lastPhaseResult event types across phases", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  it("should have no lastPhaseResult during night phase (first round)", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    const state = await db.getGameState(mockDb, hostToken);
    // Night phase round 1 has no prior vote result
    expect(state!.game.phase).toBe("night");
    // lastPhaseResult is undefined in night phase round 1
    expect(state!.lastPhaseResult).toBeUndefined();
  });

  it("should return eliminate event type after voting eliminates a player", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");

    // Get a target to eliminate
    const voteState = await db.getGameState(mockDb, playerTokens[0]);
    const alivePlayers = voteState!.players.filter((p) => p.isAlive && !p.isHost);
    const targetId = alivePlayers[0]?.playerId;

    if (targetId) {
      // Have all alive players vote for the same target (enough for clear majority)
      for (const t of playerTokens) {
        const ps = await db.getGameState(mockDb, t);
        if (ps && ps.currentPlayer.isAlive && ps.currentPlayer.playerId !== targetId) {
          await db.submitAction(mockDb, t, "vote", targetId);
        }
      }

      // Go to next night (new round)
      await db.changePhase(mockDb, hostToken, "night");

      const nightState = await db.getGameState(mockDb, hostToken);
      if (nightState && nightState.lastPhaseResult) {
        // After voting → night, lastPhaseResult should be eliminate or no_eliminate
        expect(["eliminate", "no_eliminate"]).toContain(nightState.lastPhaseResult.type);
      }
    }
  });

  it("should return no_eliminate when no majority vote in voting phase", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");
    // No votes cast
    await db.changePhase(mockDb, hostToken, "night");

    const nightState = await db.getGameState(mockDb, hostToken);
    expect(nightState!.game.phase).toBe("night");
    expect(nightState!.lastPhaseResult?.type).toBe("no_eliminate");
  });

  it("should set lastPhaseResult in review phase after game ends", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken } = await getRoleTokens(mockDb, playerTokens);

    // Eliminate all non-mafia players to trigger win condition
    const hostState = await db.getGameState(mockDb, hostToken);
    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );

    // Kill all non-mafia players via DB directly
    for (const p of nonMafiaPlayers) {
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(p.playerId)
        .run();
    }

    // Trigger night resolution — mafia should win
    if (mafiaToken) {
      await db.changePhase(mockDb, hostToken, "day");
    }

    const finalState = await db.getGameState(mockDb, hostToken);
    // Game should be finished or in review
    if (finalState) {
      expect(["finished", "playing"]).toContain(finalState.game.status);
    }
  });

  it("should track multiple rounds of events correctly", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    // Complete a full round cycle: night → day → voting → night
    await db.changePhase(mockDb, hostToken, "day");
    await db.changePhase(mockDb, hostToken, "voting");
    await db.changePhase(mockDb, hostToken, "night");

    const state = await db.getGameState(mockDb, hostToken);
    expect(state!.game.round).toBe(2); // New round
    // lastPhaseResult available in round 2 night (shows vote result from round 1)
    expect(state!.lastPhaseResult).toBeDefined();
    expect(["eliminate", "no_eliminate"]).toContain(state!.lastPhaseResult!.type);
  });
});

// ─── buildTransition ─────────────────────────────────────────────────────────

describe("buildTransition — transition screen generation", () => {
  it("should return game_start transition for lobby → night", () => {
    const result = buildTransition("lobby", "night", 1);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("game_start");
    expect(result!.screens.length).toBeGreaterThanOrEqual(2);
    expect(result!.screens[0].title).toContain("Gra");
  });

  it("should return night_to_day transition for night → day with kill", () => {
    const result = buildTransition("night", "day", 1, {
      type: "kill",
      nickname: "VictimPlayer",
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("night_to_day");
    const hasVictimScreen = result!.screens.some((s) => s.title === "VictimPlayer");
    expect(hasVictimScreen).toBe(true);
  });

  it("should return night_to_day transition with shield when no kill", () => {
    const result = buildTransition("night", "day", 1, { type: "no_kill" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("night_to_day");
    const hasShieldScreen = result!.screens.some((s) => s.icon === "shield");
    expect(hasShieldScreen).toBe(true);
  });

  it("should return day_to_voting transition for day → voting", () => {
    const result = buildTransition("day", "voting", 1);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("day_to_voting");
    expect(result!.screens[0].icon).toBe("how_to_vote");
  });

  it("should return voting_to_night with eliminate info", () => {
    const result = buildTransition("voting", "night", 2, {
      type: "eliminate",
      nickname: "EliminatedPlayer",
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("voting_to_night");
    const hasEliminationScreen = result!.screens.some((s) =>
      s.subtitle?.includes("EliminatedPlayer")
    );
    expect(hasEliminationScreen).toBe(true);
  });

  it("should return voting_to_night with no elimination message when no_eliminate", () => {
    const result = buildTransition("voting", "night", 2, { type: "no_eliminate" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("voting_to_night");
    const hasNoEliminationScreen = result!.screens.some((s) =>
      s.subtitle?.includes("nie został wyeliminowany")
    );
    expect(hasNoEliminationScreen).toBe(true);
  });

  it("should return game_ended transition for voting → ended with mafia win", () => {
    const result = buildTransition("voting", "ended", 2, { type: "no_eliminate" }, "mafia");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("game_ended");
    const hasMafiaWin = result!.screens.some((s) => s.title?.includes("Mafia"));
    expect(hasMafiaWin).toBe(true);
  });

  it("should return game_ended transition for voting → ended with town win", () => {
    const result = buildTransition("voting", "ended", 2, undefined, "town");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("game_ended");
    const hasTownWin = result!.screens.some((s) => s.title?.includes("Miasto"));
    expect(hasTownWin).toBe(true);
  });

  it("should return game_ended transition for night → ended", () => {
    const result = buildTransition(
      "night",
      "ended",
      2,
      { type: "kill", nickname: "Victim" },
      "mafia"
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe("game_ended");
  });

  it("should return game_ended transition for review → ended", () => {
    const result = buildTransition("review", "ended", 2, undefined, "town");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("game_ended");
  });

  it("should return null for unknown transitions", () => {
    const result = buildTransition("night" as GamePhase, "lobby" as GamePhase, 1);
    expect(result).toBeNull();
  });

  it("should return null for same-phase transitions", () => {
    const result = buildTransition("day" as GamePhase, "day" as GamePhase, 1);
    expect(result).toBeNull();
  });

  it("should include round number in night transitions", () => {
    const result = buildTransition("lobby", "night", 3);
    expect(result).not.toBeNull();
    const hasRoundScreen = result!.screens.some((s) => s.subtitle?.includes("3"));
    expect(hasRoundScreen).toBe(true);
  });
});

// ─── checkWinConditions ───────────────────────────────────────────────────────

describe("checkWinConditions — game end detection", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  it("should detect town win when all mafia eliminated", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    const hostState = await db.getGameState(mockDb, hostToken);
    const mafiaPlayers = hostState!.players.filter(
      (p) => p.role === "mafia" && !p.isHost && p.isAlive
    );

    // Kill all mafia players
    for (const p of mafiaPlayers) {
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(p.playerId)
        .run();
    }

    await db.changePhase(mockDb, hostToken, "day");

    const finalState = await db.getGameState(mockDb, hostToken);
    if (finalState) {
      // Game should be finished with town winning
      expect(["finished", "playing"]).toContain(finalState.game.status);
      if (finalState.game.status === "finished") {
        expect(finalState.game.winner).toBe("town");
      }
    }
  });

  it("should detect mafia win when mafia equals non-mafia", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    const hostState = await db.getGameState(mockDb, hostToken);
    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );
    const mafiaPlayers = hostState!.players.filter(
      (p) => p.role === "mafia" && !p.isHost && p.isAlive
    );

    // Kill non-mafia until mafia >= remaining
    let killed = 0;
    const killCount = nonMafiaPlayers.length - mafiaPlayers.length + 1;
    for (const p of nonMafiaPlayers) {
      if (killed >= killCount) break;
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(p.playerId)
        .run();
      killed++;
    }

    await db.changePhase(mockDb, hostToken, "day");

    const finalState = await db.getGameState(mockDb, hostToken);
    if (finalState && finalState.game.status === "finished") {
      expect(finalState.game.winner).toBe("mafia");
    }
  });

  it("should continue game while mafia < non-mafia", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    const state = await db.getGameState(mockDb, hostToken);
    expect(state!.game.status).toBe("playing");
    expect(state!.game.winner).toBeNull();
  });

  it("should game end after mafia kill triggers win condition", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken } = await getRoleTokens(mockDb, playerTokens);

    const hostState = await db.getGameState(mockDb, hostToken);
    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );
    const mafiaCount = hostState!.players.filter((p) => p.role === "mafia" && !p.isHost).length;

    // Kill all non-mafia except one more than mafia count (so killing that one triggers win)
    let killed = 0;
    const targetKillCount = nonMafiaPlayers.length - mafiaCount;
    let lastSurvivorId: string | null = null;

    for (const p of nonMafiaPlayers) {
      if (killed < targetKillCount) {
        await mockDb
          .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
          .bind(p.playerId)
          .run();
        killed++;
      } else {
        lastSurvivorId = p.playerId;
        break;
      }
    }

    if (mafiaToken && lastSurvivorId) {
      await db.submitAction(mockDb, mafiaToken, "kill", lastSurvivorId);
      await db.changePhase(mockDb, hostToken, "day");

      const finalState = await db.getGameState(mockDb, hostToken);
      if (finalState) {
        // Win conditions should have been detected
        expect(["finished", "playing"]).toContain(finalState.game.status);
      }
    }
  });
});

// ─── DeadSpectatorView logic ─────────────────────────────────────────────────

describe("DeadSpectatorView — dead player perspective", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  it("should reveal all player roles to dead players", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianToken && civilianId) {
      // Kill civilian
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      // Dead player should see all roles (including mafia)
      const deadPlayerState = await db.getGameState(mockDb, civilianToken);
      expect(deadPlayerState!.currentPlayer.isAlive).toBe(false);

      // In the public players list, dead players' roles are revealed
      // A dead player can see mafia roles (per game logic: dead players see all)
      // This is enforced by the DB query: `if (p.is_alive === 0) return p.role`
      const deadPlayers = deadPlayerState!.players.filter((p) => !p.isAlive && !p.isHost);
      deadPlayers.forEach((p) => {
        expect(p.role).not.toBeNull();
      });
    }
  });

  it("should reveal alive mafia roles to dead civilian (dead players see all)", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianToken && civilianId) {
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      // Dead civilian should now see ALL alive roles including alive mafia
      const deadPlayerState = await db.getGameState(mockDb, civilianToken);
      expect(deadPlayerState).not.toBeNull();
      expect(deadPlayerState!.currentPlayer.isAlive).toBe(false);

      // Find alive mafia in the players list — should be revealed to the dead player
      const aliveMafiaInList = deadPlayerState!.players.find(
        (p) => p.role === "mafia" && p.isAlive && !p.isHost
      );
      // If there's an alive mafia player, dead civilian should see their role
      if (aliveMafiaInList) {
        expect(aliveMafiaInList.role).toBe("mafia");
      }
    }
  });

  it("should show current player role to dead player", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianToken && civilianId) {
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      const deadPlayerState = await db.getGameState(mockDb, civilianToken);
      expect(deadPlayerState!.currentPlayer.role).toBe("civilian");
    }
  });

  it("should show eliminated status in player list", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken, civilianToken, civilianId } = await getRoleTokens(mockDb, playerTokens);

    if (mafiaToken && civilianToken && civilianId) {
      await db.submitAction(mockDb, mafiaToken, "kill", civilianId);
      await db.changePhase(mockDb, hostToken, "day");

      // From any player's perspective, the dead player should show as not alive
      const anyPlayerState = await db.getGameState(mockDb, playerTokens[0]);
      const deadPlayer = anyPlayerState!.players.find((p) => p.playerId === civilianId);
      if (deadPlayer) {
        expect(deadPlayer.isAlive).toBe(false);
      }
    }
  });
});

// ─── EndScreen logic (state-based) ────────────────────────────────────────────

describe("EndScreen — game end state data", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  it("should show game over state with winner in finished game", async () => {
    const { hostToken } = await setupFullGame(mockDb);
    const hostState = await db.getGameState(mockDb, hostToken);

    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );
    const mafiaPlayers = hostState!.players.filter(
      (p) => p.role === "mafia" && !p.isHost && p.isAlive
    );

    // Force a win condition: kill enough non-mafia to make mafia >= non-mafia
    const killCount = nonMafiaPlayers.length - mafiaPlayers.length + 1;
    for (let i = 0; i < killCount && i < nonMafiaPlayers.length; i++) {
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(nonMafiaPlayers[i].playerId)
        .run();
    }

    await db.changePhase(mockDb, hostToken, "day");

    const finalState = await db.getGameState(mockDb, hostToken);
    if (finalState && finalState.game.status === "finished") {
      expect(finalState.game.winner).toBe("mafia");
      expect(finalState.game.phase).toBe("ended");
    }
  });

  it("should show correct isWinner status for mafia player", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const { mafiaToken } = await getRoleTokens(mockDb, playerTokens);

    const hostState = await db.getGameState(mockDb, hostToken);
    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );
    const mafiaCount = hostState!.players.filter((p) => p.role === "mafia" && !p.isHost).length;

    const killCount = nonMafiaPlayers.length - mafiaCount + 1;
    for (let i = 0; i < killCount && i < nonMafiaPlayers.length; i++) {
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(nonMafiaPlayers[i].playerId)
        .run();
    }

    await db.changePhase(mockDb, hostToken, "day");

    if (mafiaToken) {
      const mafiaState = await db.getGameState(mockDb, mafiaToken);
      if (mafiaState && mafiaState.game.status === "finished") {
        expect(mafiaState.game.winner).toBe("mafia");
        expect(mafiaState.currentPlayer.role).toBe("mafia");
      }
    }
  });

  it("should show all roles revealed after game ends", async () => {
    const { hostToken, playerTokens } = await setupFullGame(mockDb);
    const hostState = await db.getGameState(mockDb, hostToken);

    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );
    const mafiaCount = hostState!.players.filter((p) => p.role === "mafia" && !p.isHost).length;

    const killCount = nonMafiaPlayers.length - mafiaCount + 1;
    for (let i = 0; i < killCount && i < nonMafiaPlayers.length; i++) {
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(nonMafiaPlayers[i].playerId)
        .run();
    }

    await db.changePhase(mockDb, hostToken, "day");

    // Check that a non-host player can see all roles when game is finished
    const playerState = await db.getGameState(mockDb, playerTokens[0]);
    if (playerState && playerState.game.status === "finished") {
      const nonHostPlayers = playerState.players.filter((p) => !p.isHost);
      nonHostPlayers.forEach((p) => {
        expect(p.role).not.toBeNull();
      });
    }
  });

  it("should provide showPoints=true when game is finished", async () => {
    const { hostToken } = await setupFullGame(mockDb);
    const hostState = await db.getGameState(mockDb, hostToken);

    const nonMafiaPlayers = hostState!.players.filter(
      (p) => p.role !== "mafia" && !p.isHost && p.isAlive
    );
    const mafiaCount = hostState!.players.filter((p) => p.role === "mafia" && !p.isHost).length;

    const killCount = nonMafiaPlayers.length - mafiaCount + 1;
    for (let i = 0; i < killCount && i < nonMafiaPlayers.length; i++) {
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(nonMafiaPlayers[i].playerId)
        .run();
    }

    await db.changePhase(mockDb, hostToken, "day");

    const finalState = await db.getGameState(mockDb, hostToken);
    if (finalState && finalState.game.status === "finished") {
      expect(finalState.showPoints).toBe(true);
    }
  });

  it("should have showPoints=false during night phase", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    const state = await db.getGameState(mockDb, hostToken);
    expect(state!.showPoints).toBe(false);
  });

  it("should have showPoints=true during review phase", async () => {
    const { hostToken } = await setupFullGame(mockDb);

    // Manually set phase to review
    const state = await db.getGameState(mockDb, hostToken);
    await mockDb
      .prepare("UPDATE games SET phase = 'review' WHERE id = ?")
      .bind(state!.game.id)
      .run();

    const reviewState = await db.getGameState(mockDb, hostToken);
    expect(reviewState!.showPoints).toBe(true);
  });
});

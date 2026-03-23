import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSqliteD1, SqliteD1Database } from "@/__tests__/helpers/sqliteD1";
import * as db from "@/db";

vi.mock("nanoid", () => {
  let counter = 0;
  return {
    nanoid: vi.fn(() => `id-${++counter}-${Date.now()}`),
  };
});

describe("Secret Voting Tests", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  describe("Game Configuration", () => {
    it("should store secretVoting=true in game config JSON", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", true);

      // Check raw database config
      const gameRow = await mockDb
        .prepare("SELECT config FROM games WHERE code = ?")
        .bind(code)
        .first<{ config: string }>();

      const config = JSON.parse(gameRow!.config);
      expect(config.secretVoting).toBe(true);
    });

    it("should store secretVoting=false in game config JSON when explicitly set", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", false);

      const gameRow = await mockDb
        .prepare("SELECT config FROM games WHERE code = ?")
        .bind(code)
        .first<{ config: string }>();

      const config = JSON.parse(gameRow!.config);
      expect(config.secretVoting).toBe(false);
    });

    it("should default secretVoting to false when not specified", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "full"); // No secretVoting parameter

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.config.secretVoting).toBe(false);

      const gameRow = await mockDb
        .prepare("SELECT config FROM games WHERE code = ?")
        .bind(code)
        .first<{ config: string }>();

      const config = JSON.parse(gameRow!.config);
      expect(config.secretVoting).toBe(false);
    });

    it("should handle malformed config gracefully", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);

      // Manually corrupt the config
      await mockDb
        .prepare("UPDATE games SET config = ? WHERE id = ?")
        .bind("{invalid json", hostState!.game.id)
        .run();

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.config.secretVoting).toBe(false); // Should default to false
    });
  });

  describe("Vote Tally Filtering", () => {
    async function setupVotingGame(secretVoting: boolean) {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", secretVoting);
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      return { hostToken, playerTokens, code };
    }

    it("should hide voteTally results from players when secretVoting=true", async () => {
      const { hostToken, playerTokens } = await setupVotingGame(true);

      // Cast some votes
      const state = await db.getGameState(mockDb, hostToken);
      const targets = state!.players.filter((p) => !p.isHost && p.isAlive);

      await db.submitAction(mockDb, playerTokens[0], "vote", targets[0].playerId);
      await db.submitAction(mockDb, playerTokens[1], "vote", targets[0].playerId);
      await db.submitAction(mockDb, playerTokens[2], "vote", targets[1].playerId);

      // GM should see full results
      const gmState = await db.getGameState(mockDb, hostToken);
      expect(gmState!.voteTally).toBeDefined();
      expect(gmState!.voteTally!.totalVoters).toBeGreaterThan(0);
      expect(gmState!.voteTally!.votedCount).toBe(3);
      expect(gmState!.voteTally!.results.length).toBeGreaterThan(0); // Only players with votes appear

      const targetVotes = gmState!.voteTally!.results.find(
        (r) => r.playerId === targets[0].playerId
      );
      expect(targetVotes!.votes).toBe(2);

      // Players should see filtered results (empty array)
      const playerState = await db.getGameState(mockDb, playerTokens[0]);
      expect(playerState!.voteTally).toBeDefined();
      expect(playerState!.voteTally!.totalVoters).toBe(gmState!.voteTally!.totalVoters);
      expect(playerState!.voteTally!.votedCount).toBe(gmState!.voteTally!.votedCount);
      expect(playerState!.voteTally!.results).toEqual([]);
    });

    it("should show full voteTally to all players when secretVoting=false", async () => {
      const { hostToken, playerTokens } = await setupVotingGame(false);

      // Cast some votes
      const state = await db.getGameState(mockDb, hostToken);
      const targets = state!.players.filter((p) => !p.isHost && p.isAlive);

      await db.submitAction(mockDb, playerTokens[0], "vote", targets[0].playerId);
      await db.submitAction(mockDb, playerTokens[1], "vote", targets[1].playerId);

      // Both GM and players should see identical results
      const gmState = await db.getGameState(mockDb, hostToken);
      const playerState = await db.getGameState(mockDb, playerTokens[0]);

      expect(gmState!.voteTally!.results.length).toBeGreaterThan(0);
      expect(playerState!.voteTally!.results).toEqual(gmState!.voteTally!.results);

      const target0Votes = playerState!.voteTally!.results.find(
        (r) => r.playerId === targets[0].playerId
      )!.votes;
      const target1Votes = playerState!.voteTally!.results.find(
        (r) => r.playerId === targets[1].playerId
      )!.votes;

      expect(target0Votes).toBe(1);
      expect(target1Votes).toBe(1);
    });

    it("should show correct vote counts to GM even with secret voting", async () => {
      const { hostToken, playerTokens } = await setupVotingGame(true);

      const state = await db.getGameState(mockDb, hostToken);
      const target = state!.players.filter((p) => !p.isHost && p.isAlive)[0];

      // Multiple players vote for same target
      await db.submitAction(mockDb, playerTokens[0], "vote", target.playerId);
      await db.submitAction(mockDb, playerTokens[1], "vote", target.playerId);
      await db.submitAction(mockDb, playerTokens[2], "vote", target.playerId);

      const gmState = await db.getGameState(mockDb, hostToken);
      const targetVotes = gmState!.voteTally!.results.find((r) => r.playerId === target.playerId);

      expect(targetVotes!.votes).toBe(3);
      expect(gmState!.voteTally!.votedCount).toBe(3);
    });

    it("should not show voteTally during non-voting phases regardless of secret setting", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", true);

      // Night phase
      const nightState = await db.getGameState(mockDb, hostToken);
      expect(nightState!.voteTally).toBeUndefined();

      // Day phase
      await db.changePhase(mockDb, hostToken, "day");
      const dayState = await db.getGameState(mockDb, hostToken);
      expect(dayState!.voteTally).toBeUndefined();

      // Voting phase
      await db.changePhase(mockDb, hostToken, "voting");
      const votingState = await db.getGameState(mockDb, hostToken);
      expect(votingState!.voteTally).toBeDefined();
    });
  });

  describe("Vote History After Voting Phase", () => {
    it("should show full vote history to players after voting phase ends (secret voting)", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", true);
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const votingState = await db.getGameState(mockDb, hostToken);
      const target = votingState!.players.filter((p) => !p.isHost && p.isAlive)[0];

      // Cast votes
      await db.submitAction(mockDb, playerTokens[0], "vote", target.playerId);
      await db.submitAction(mockDb, playerTokens[1], "vote", target.playerId);

      // During voting: players can't see results
      const secretState = await db.getGameState(mockDb, playerTokens[0]);
      expect(secretState!.voteTally!.results).toEqual([]);

      // End voting phase
      await db.changePhase(mockDb, hostToken, "night");

      // After voting: players should see vote history
      const postVotingState = await db.getGameState(mockDb, playerTokens[0]);
      expect(postVotingState!.voteHistory).toBeDefined();
      expect(postVotingState!.voteHistory).toHaveLength(1);

      const round1History = postVotingState!.voteHistory![0];
      expect(round1History.round).toBe(1);
      expect(round1History.results.length).toBeGreaterThan(0);

      const targetResult = round1History.results.find((r) => r.playerId === target.playerId);
      expect(targetResult!.votes).toBe(2);
    });

    it("should preserve vote history across multiple rounds", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 6; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", true);

      // Round 1 voting
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const round1State = await db.getGameState(mockDb, hostToken);
      const target1 = round1State!.players.filter((p) => !p.isHost && p.isAlive)[0];

      await db.submitAction(mockDb, playerTokens[0], "vote", target1.playerId);
      await db.changePhase(mockDb, hostToken, "night");

      // Round 2 voting
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const round2State = await db.getGameState(mockDb, hostToken);
      const target2 = round2State!.players.filter(
        (p) => !p.isHost && p.isAlive && p.playerId !== target1.playerId
      )[0];

      await db.submitAction(mockDb, playerTokens[1], "vote", target2.playerId);
      await db.changePhase(mockDb, hostToken, "night");

      // Check history contains both rounds
      const finalState = await db.getGameState(mockDb, playerTokens[0]);
      expect(finalState!.voteHistory).toHaveLength(2);

      const round1Record = finalState!.voteHistory!.find((h) => h.round === 1);
      const round2Record = finalState!.voteHistory!.find((h) => h.round === 2);

      expect(round1Record).toBeDefined();
      expect(round2Record).toBeDefined();
      expect(round1Record!.results.find((r) => r.playerId === target1.playerId)!.votes).toBe(1);
      expect(round2Record!.results.find((r) => r.playerId === target2.playerId)!.votes).toBe(1);
    });
  });

  describe("Secret Voting with Mafia Team Actions", () => {
    it("should not affect mafia team visibility during night phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 6; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, 2, "full", true); // Secret voting + 2 mafia

      const gameState = await db.getGameState(mockDb, hostToken);
      const target = gameState!.players.find((p) => p.role === "civilian")!;

      // Find mafia tokens by checking each token's player state
      let mafia1Token = "";
      let mafia2Token = "";

      for (const token of playerTokens) {
        const playerState = await db.getGameState(mockDb, token);
        if (playerState && playerState.currentPlayer.role === "mafia") {
          if (!mafia1Token) {
            mafia1Token = token;
          } else if (!mafia2Token) {
            mafia2Token = token;
            break;
          }
        }
      }

      // Mafia actions during night (should not be affected by secret voting)
      await db.submitAction(mockDb, mafia1Token, "kill", target.playerId);

      const mafia1State = await db.getGameState(mockDb, mafia1Token);
      const mafia2State = await db.getGameState(mockDb, mafia2Token);

      // Both mafia should see team actions (if they exist)
      if (mafia1State && mafia2State) {
        expect(mafia1State.mafiaTeamActions).toBeDefined();
        expect(mafia2State.mafiaTeamActions).toBeDefined();
        expect(mafia1State.mafiaTeamActions!.length).toBe(1);
        expect(mafia2State.mafiaTeamActions!.length).toBe(1);

        const action = mafia1State.mafiaTeamActions![0];
        expect(action.targetPlayerId).toBe(target.playerId);
        expect(action.targetNickname).toBe(target.nickname);
      }
    });
  });

  describe("Integration with Game Phases", () => {
    it("should maintain secret voting setting through phase transitions", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "full", true);

      // Check through all phases
      const phases = ["night", "day", "voting"];
      for (const phase of phases) {
        if (phase !== "night") {
          await db.changePhase(mockDb, hostToken, phase);
        }

        const phaseState = await db.getGameState(mockDb, hostToken);
        expect(phaseState!.game.config.secretVoting).toBe(true);
        expect(phaseState!.game.phase).toBe(phase);
      }
    });

    it("should maintain secret voting setting after rematch", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      // Start with secret voting
      await db.startGame(mockDb, hostToken, undefined, "simple", true);

      // Force game to end
      await mockDb
        .prepare("UPDATE games SET status = 'finished', winner = 'mafia' WHERE id = ?")
        .bind(hostState!.game.id)
        .run();

      // Rematch
      await db.rematch(mockDb, hostToken);

      // Start new game - should preserve secret voting setting
      await db.startGame(mockDb, hostToken);
      const newGameState = await db.getGameState(mockDb, hostToken);

      expect(newGameState!.game.config.secretVoting).toBe(true);
    });
  });
});

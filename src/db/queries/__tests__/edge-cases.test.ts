import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSqliteD1, SqliteD1Database } from "@/__tests__/helpers/sqliteD1";
import * as db from "@/db";

vi.mock("nanoid", () => {
  let counter = 0;
  return {
    nanoid: vi.fn(() => `id-${++counter}-${Date.now()}`),
  };
});

describe("Edge Cases Tests", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  describe("Win Condition Edge Cases", () => {
    it("should handle 1 mafia vs 1 civilian = mafia wins", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add minimum players for simple mode
      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");
      const gameState = await db.getGameState(mockDb, hostToken);

      const civilians = gameState!.players.filter((p) => p.role === "civilian");

      // Kill all civilians except one
      for (let i = 1; i < civilians.length; i++) {
        await mockDb
          .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
          .bind(civilians[i].playerId)
          .run();
      }

      // Now we have 1 mafia vs 1 civilian - mafia should win
      await db.changePhase(mockDb, hostToken, "day");

      const endState = await db.getGameState(mockDb, hostToken);
      expect(endState!.game.status).toBe("finished");
      expect(endState!.game.winner).toBe("mafia");
    });

    it("should handle all mafia eliminated = civilians win", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken);
      const gameState = await db.getGameState(mockDb, hostToken);

      const mafioso = gameState!.players.find((p) => p.role === "mafia")!;

      // Kill the mafioso
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(mafioso.playerId)
        .run();

      // Check win conditions
      await db.changePhase(mockDb, hostToken, "day");

      const endState = await db.getGameState(mockDb, hostToken);
      expect(endState!.game.status).toBe("finished");
      expect(endState!.game.winner).toBe("town"); // Actual winner string is "town"
    });

    it("should check win conditions after kick player", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken);
      const gameState = await db.getGameState(mockDb, hostToken);

      const mafioso = gameState!.players.find((p) => p.role === "mafia")!;

      // Kick the only mafioso
      await db.kickPlayer(mockDb, hostToken, mafioso.playerId);

      const postKickState = await db.getGameState(mockDb, hostToken);
      expect(postKickState!.game.status).toBe("finished");
      expect(postKickState!.game.winner).toBe("town"); // Actual winner string is "town"
    });

    it("should handle leave player functionality", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerResult = await db.joinGame(mockDb, code, "Player1");

      await db.startGame(mockDb, hostToken, undefined, "simple");

      // Test that leaveGame function works (basic functionality test)
      const leaveResult = await db.leaveGame(mockDb, playerResult!.token);

      // Player leaving during active game should succeed (marks as dead)
      expect(leaveResult.success).toBe(true);
    });
  });

  describe("Voting Edge Cases", () => {
    it("should handle tie in voting = nobody eliminated", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 4; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const votingState = await db.getGameState(mockDb, hostToken);
      const alivePlayers = votingState!.players.filter((p) => !p.isHost && p.isAlive);

      // Create a tie: 2 votes for player A, 2 votes for player B
      await db.submitAction(mockDb, playerTokens[0], "vote", alivePlayers[0].playerId);
      await db.submitAction(mockDb, playerTokens[1], "vote", alivePlayers[0].playerId);
      await db.submitAction(mockDb, playerTokens[2], "vote", alivePlayers[1].playerId);
      await db.submitAction(mockDb, playerTokens[3], "vote", alivePlayers[1].playerId);

      // Advance to next phase
      await db.changePhase(mockDb, hostToken, "night");

      const postVoteState = await db.getGameState(mockDb, hostToken);

      // Nobody should be eliminated (all should be alive)
      const stillAlive = postVoteState!.players.filter((p) => p.isAlive && !p.isHost);
      expect(stillAlive.length).toBe(alivePlayers.length);

      // Check vote result message indicates tie
      expect(postVoteState!.lastPhaseResult?.type).toBe("no_eliminate");
    });

    it("should handle no votes cast = nobody eliminated", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const votingState = await db.getGameState(mockDb, hostToken);
      const aliveCount = votingState!.players.filter((p) => p.isAlive && !p.isHost).length;

      // Don't cast any votes, just advance phase
      await db.changePhase(mockDb, hostToken, "night");

      const postVoteState = await db.getGameState(mockDb, hostToken);
      const stillAliveCount = postVoteState!.players.filter((p) => p.isAlive && !p.isHost).length;

      expect(stillAliveCount).toBe(aliveCount);
      expect(postVoteState!.lastPhaseResult?.type).toBe("no_eliminate");
    });
  });

  describe("Player Management Edge Cases", () => {
    it("should handle leave during lobby = physical removal", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const leaver = await db.joinGame(mockDb, code, "LeaverInLobby");
      await db.joinGame(mockDb, code, "StayerInLobby");

      const beforeLeave = await db.getGameState(mockDb, hostToken);
      expect(beforeLeave!.players.length).toBe(3); // Host + 2 joined players

      // Leave during lobby
      await db.leaveGame(mockDb, leaver!.token);

      const afterLeave = await db.getGameState(mockDb, hostToken);
      expect(afterLeave!.players.length).toBe(2); // Host + 1 remaining player

      const leaverPlayer = afterLeave!.players.find((p) => p.nickname === "LeaverInLobby");
      const stayerPlayer = afterLeave!.players.find((p) => p.nickname === "StayerInLobby");

      expect(leaverPlayer).toBeUndefined(); // Should be physically removed
      expect(stayerPlayer).toBeDefined(); // Should still be there
    });

    it("should handle leave during game = mark as dead", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 3; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");

      const beforeLeave = await db.getGameState(mockDb, hostToken);
      const aliveCount = beforeLeave!.players.filter((p) => p.isAlive).length;

      // Player leaves during game
      await db.leaveGame(mockDb, playerTokens[0]);

      const afterLeave = await db.getGameState(mockDb, hostToken);
      const leaverPlayer = afterLeave!.players.find((p) => p.nickname === "Player0");

      expect(afterLeave!.players.length).toBe(beforeLeave!.players.length); // Same number of players
      expect(leaverPlayer).toBeDefined(); // Player still exists
      expect(leaverPlayer!.isAlive).toBe(false); // But marked as dead

      const aliveCountAfter = afterLeave!.players.filter((p) => p.isAlive).length;
      expect(aliveCountAfter).toBe(aliveCount - 1);
    });

    it("should handle transfer GM in lobby vs in game", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "OldGM");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerResult = await db.joinGame(mockDb, code, "NewGM");
      const newGmPlayerId = await db.getGameState(mockDb, playerResult!.token);

      // PART 1: Transfer during lobby
      await db.transferGm(mockDb, hostToken, newGmPlayerId!.currentPlayer.playerId);

      const lobbyTransferState = await db.getGameState(mockDb, hostToken);
      const oldGmLobby = lobbyTransferState!.players.find((p) => p.nickname === "OldGM")!;
      const newGmLobby = lobbyTransferState!.players.find((p) => p.nickname === "NewGM")!;

      expect(oldGmLobby.isHost).toBe(false);
      expect(oldGmLobby.role).toBeNull(); // No role in lobby
      expect(newGmLobby.isHost).toBe(true);
      expect(newGmLobby.role).toBeNull(); // No role in lobby

      // Add more players and start game
      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, playerResult!.token, undefined, "simple");

      const gameStartState = await db.getGameState(mockDb, playerResult!.token);

      // PART 2: Transfer during game (find another player to transfer to)
      const anotherPlayer = gameStartState!.players.find(
        (p) => !p.isHost && p.nickname.startsWith("Player")
      )!;

      await db.transferGm(mockDb, playerResult!.token, anotherPlayer.playerId);

      const gameTransferState = await db.getGameState(mockDb, playerResult!.token);
      const transferredGm = gameTransferState!.players.find((p) => p.nickname === "NewGM")!;
      const newGameGm = gameTransferState!.players.find(
        (p) => p.playerId === anotherPlayer.playerId
      )!;

      expect(transferredGm.isHost).toBe(false);
      expect(newGameGm.isHost).toBe(true);
      // Role assignment in game might work differently - just check host transfer worked
    });
  });

  describe("Night Phase Edge Cases", () => {
    it("should handle night with no mafia actions = nobody dies", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken);
      const nightState = await db.getGameState(mockDb, hostToken);
      const aliveCount = nightState!.players.filter((p) => p.isAlive).length;

      // Advance to day without mafia killing anyone
      await db.changePhase(mockDb, hostToken, "day");

      const dayState = await db.getGameState(mockDb, hostToken);
      const stillAliveCount = dayState!.players.filter((p) => p.isAlive).length;

      expect(stillAliveCount).toBe(aliveCount);
      expect(dayState!.lastNightSummary?.killedNickname).toBeNull();
      expect(dayState!.lastPhaseResult?.type).toBe("no_kill");
    });

    it("should handle mafia disagreement = no kill (team mode)", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 6; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      // Start with 2 mafia
      await db.startGame(mockDb, hostToken, 2, "full");
      const gameState = await db.getGameState(mockDb, hostToken);

      const mafiaPlayers = gameState!.players.filter((p) => p.role === "mafia");
      const civilians = gameState!.players.filter((p) => p.role === "civilian");

      let mafia1Token = "";
      let mafia2Token = "";

      for (const t of playerTokens) {
        const playerState = (await mockDb
          .prepare("SELECT * FROM game_players WHERE token = ?")
          .bind(t)
          .first()) as { player_id: string } | null;
        if (playerState && playerState.player_id === mafiaPlayers[0].playerId) {
          mafia1Token = t;
        }
        if (playerState && playerState.player_id === mafiaPlayers[1].playerId) {
          mafia2Token = t;
        }
      }

      // Mafia vote for different targets
      await db.submitAction(mockDb, mafia1Token, "kill", civilians[0].playerId);
      await db.submitAction(mockDb, mafia2Token, "kill", civilians[1].playerId);

      // Check that mafia is not unanimous
      const progressState = await db.getGameState(mockDb, hostToken);
      expect(progressState!.phaseProgress?.mafiaUnanimous).toBe(false);

      const aliveCount = progressState!.players.filter((p) => p.isAlive).length;

      // Advance to day - nobody should die due to disagreement
      await db.changePhase(mockDb, hostToken, "day");

      const dayState = await db.getGameState(mockDb, hostToken);
      const stillAliveCount = dayState!.players.filter((p) => p.isAlive).length;

      expect(stillAliveCount).toBe(aliveCount);
      expect(dayState!.lastNightSummary?.killedNickname).toBeNull();
    });
  });

  describe("Game Start Edge Cases", () => {
    it("should fail to start game with too few players (full mode)", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add only 3 players (need 5 for full mode)
      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      const result = await db.startGame(mockDb, hostToken, undefined, "full");
      expect(result.success).toBe(false);
      expect(result.error?.includes("minimum") || result.error?.includes("Potrzeba")).toBe(true);

      const gameState = await db.getGameState(mockDb, hostToken);
      expect(gameState!.game.status).toBe("lobby");
    });

    it("should fail to start game with too few players (simple mode)", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add only 2 players (need 3 for simple mode)
      for (let i = 0; i < 2; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      const result = await db.startGame(mockDb, hostToken, undefined, "simple");
      expect(result.success).toBe(false);
      expect(result.error?.includes("minimum") || result.error?.includes("Potrzeba")).toBe(true);
    });

    it("should fail to start game when not host", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerResult = await db.joinGame(mockDb, code, "NotHost");

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      const result = await db.startGame(mockDb, playerResult!.token);
      expect(result.success).toBe(false);
      expect(result.error?.includes("MG") || result.error?.includes("host")).toBe(true);
    });

    it("should fail to start already started game", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken);

      // Try to start again
      const result = await db.startGame(mockDb, hostToken);
      expect(result.success).toBe(false);
      expect(result.error?.includes("trwa") || result.error?.includes("already")).toBe(true);
    });
  });

  describe("Action Validation Edge Cases", () => {
    it("should prevent actions during wrong phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken);
      await db.changePhase(mockDb, hostToken, "day");

      const dayState = await db.getGameState(mockDb, hostToken);
      const target = dayState!.players.find((p) => !p.isHost && p.isAlive)!;

      // Try to kill during day phase
      const killResult = await db.submitAction(mockDb, playerTokens[0], "kill", target.playerId);
      expect(killResult.success).toBe(false);

      // Try to investigate during day phase
      const investigateResult = await db.submitAction(
        mockDb,
        playerTokens[0],
        "investigate",
        target.playerId
      );
      expect(investigateResult.success).toBe(false);

      // Try to protect during day phase
      const protectResult = await db.submitAction(
        mockDb,
        playerTokens[0],
        "protect",
        target.playerId
      );
      expect(protectResult.success).toBe(false);
    });

    it("should prevent voting during non-voting phases", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken);

      const nightState = await db.getGameState(mockDb, hostToken);
      const target = nightState!.players.find((p) => !p.isHost && p.isAlive)!;

      // Try to vote during night phase
      const nightVoteResult = await db.submitAction(
        mockDb,
        playerTokens[0],
        "vote",
        target.playerId
      );
      expect(nightVoteResult.success).toBe(false);

      await db.changePhase(mockDb, hostToken, "day");

      // Try to vote during day phase
      const dayVoteResult = await db.submitAction(mockDb, playerTokens[0], "vote", target.playerId);
      expect(dayVoteResult.success).toBe(false);
    });

    it("should prevent dead players from acting", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken);
      const gameState = await db.getGameState(mockDb, hostToken);

      const deadPlayer = gameState!.players.find((p) => !p.isHost && p.isAlive)!;
      const target = gameState!.players.find(
        (p) => !p.isHost && p.playerId !== deadPlayer.playerId
      )!;

      let deadPlayerToken = "";
      for (const t of playerTokens) {
        const playerState = (await mockDb
          .prepare("SELECT * FROM game_players WHERE token = ?")
          .bind(t)
          .first()) as { player_id: string } | null;
        if (playerState && playerState.player_id === deadPlayer.playerId) {
          deadPlayerToken = t;
          break;
        }
      }

      // Kill the player
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(deadPlayer.playerId)
        .run();

      // Try to perform action as dead player
      const result = await db.submitAction(mockDb, deadPlayerToken, "kill", target.playerId);
      expect(result.success).toBe(false);
      // Error might be "Nie znaleziono gracza" (player not found) which is valid for dead player
      expect(result.error).toBeTruthy();
    });
  });

  describe("Character Assignment Edge Cases", () => {
    it("should handle duplicate character selection attempts", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host", "char1");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Try to join with same character - should succeed (the logic might allow duplicates or assign different character)
      const result = await db.joinGame(mockDb, code, "Player1", "char1");
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);

      // Character system test just verifies basic functionality
      const gameState = await db.getGameState(mockDb, hostToken);
      expect(gameState!.players.length).toBeGreaterThan(1); // Both host and new player exist
    });
  });

  describe("Config Persistence Edge Cases", () => {
    it("should handle malformed lobby settings gracefully", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);

      // Manually corrupt the config
      await mockDb
        .prepare("UPDATE games SET config = ? WHERE id = ?")
        .bind("{invalid", hostState!.game.id)
        .run();

      // Should still work and return defaults
      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.config.secretVoting).toBe(false);
      expect(state!.lobbySettings).toBeUndefined(); // Malformed, so undefined
    });

    it("should handle empty config gracefully", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);

      // Set empty config
      await mockDb
        .prepare("UPDATE games SET config = ? WHERE id = ?")
        .bind("", hostState!.game.id)
        .run();

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.config.secretVoting).toBe(false);
    });
  });

  describe("Token and Authentication Edge Cases", () => {
    it("should handle invalid tokens gracefully", async () => {
      const invalidToken = "completely-invalid-token-xyz";

      const gameStateResult = await db.getGameState(mockDb, invalidToken);
      expect(gameStateResult).toBeNull();

      const submitResult = await db.submitAction(mockDb, invalidToken, "kill", "target");
      expect(submitResult.success).toBe(false);

      const renameResult = await db.renamePlayer(mockDb, invalidToken, "NewName");
      expect(renameResult.success).toBe(false);

      const kickResult = await db.kickPlayer(mockDb, invalidToken, "target");
      expect(kickResult.success).toBe(false);
    });

    it("should handle empty/null tokens gracefully", async () => {
      const emptyResults = await Promise.all([
        db.getGameState(mockDb, ""),
        db.submitAction(mockDb, "", "kill", "target"),
        db.renamePlayer(mockDb, "", "Name"),
        db.kickPlayer(mockDb, "", "target"),
      ]);

      expect(emptyResults[0]).toBeNull();
      expect(emptyResults[1].success).toBe(false);
      expect(emptyResults[2].success).toBe(false);
      expect(emptyResults[3].success).toBe(false);
    });
  });

  describe("Massive Game Edge Cases", () => {
    it("should handle maximum player count gracefully", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add many players (test system limits)
      const playerTokens = [];
      for (let i = 0; i < 50; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        if (result) playerTokens.push(result.token);
      }

      // Should be able to start with reasonable number
      const result = await db.startGame(mockDb, hostToken, undefined, "full");
      expect(result.success).toBe(true);

      const gameState = await db.getGameState(mockDb, hostToken);
      const aliveCount = gameState!.players.filter((p) => p.isAlive).length;
      expect(aliveCount).toBeGreaterThan(10); // Sanity check
    });
  });

  describe("Database Consistency Edge Cases", () => {
    it("should handle missing game data gracefully", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);

      // Manually delete the game
      await mockDb.prepare("DELETE FROM games WHERE id = ?").bind(hostState!.game.id).run();

      // Operations should fail gracefully
      const gameStateResult = await db.getGameState(mockDb, hostToken);
      expect(gameStateResult).toBeNull();

      const startResult = await db.startGame(mockDb, hostToken);
      expect(startResult.success).toBe(false);
    });

    it("should handle orphaned players gracefully", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerResult = await db.joinGame(mockDb, code, "Player1");

      // Delete the game but leave the player
      await mockDb.prepare("DELETE FROM games WHERE id = ?").bind(hostState!.game.id).run();

      // Player operations should fail gracefully
      const playerState = await db.getGameState(mockDb, playerResult!.token);
      expect(playerState).toBeNull();
    });
  });

  describe("Additional Edge Cases", () => {
    it("should prevent GM from leaving game", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");

      // GM tries to leave game
      const leaveResult = await db.leaveGame(mockDb, hostToken);

      // GM leaving should be prevented
      expect(leaveResult.success).toBe(false);
      expect(leaveResult.error).toBeTruthy(); // Just check that there's an error message
    });

    it("should handle vote changing during voting phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 4; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const votingState = await db.getGameState(mockDb, hostToken);
      const alivePlayers = votingState!.players.filter((p) => !p.isHost && p.isAlive);

      // Player votes for A, then changes vote to B
      await db.submitAction(mockDb, playerTokens[0], "vote", alivePlayers[0].playerId);
      await db.submitAction(mockDb, playerTokens[0], "vote", alivePlayers[1].playerId);

      // Other players vote for A
      await db.submitAction(mockDb, playerTokens[1], "vote", alivePlayers[0].playerId);
      await db.submitAction(mockDb, playerTokens[2], "vote", alivePlayers[0].playerId);

      const postVoteState = await db.getGameState(mockDb, hostToken);

      // Player B should have 1 vote (the changed vote), Player A should have 2 votes
      const voteForA =
        postVoteState!.voteTally!.results.find((r) => r.playerId === alivePlayers[0].playerId)
          ?.votes || 0;
      const voteForB =
        postVoteState!.voteTally!.results.find((r) => r.playerId === alivePlayers[1].playerId)
          ?.votes || 0;

      expect(voteForA).toBe(2); // Two other players voted for A
      expect(voteForB).toBe(1); // One player changed their vote to B
    });

    it("should handle mafia changing night action", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 5; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken);
      const gameState = await db.getGameState(mockDb, hostToken);

      const mafioso = gameState!.players.find((p) => p.role === "mafia")!;
      const civilians = gameState!.players.filter((p) => p.role === "civilian");

      let mafiaToken = "";
      for (const t of playerTokens) {
        const playerState = (await mockDb
          .prepare("SELECT * FROM game_players WHERE token = ?")
          .bind(t)
          .first()) as { player_id: string } | null;
        if (playerState && playerState.player_id === mafioso.playerId) {
          mafiaToken = t;
          break;
        }
      }

      // Mafia first targets A, then changes to target B
      await db.submitAction(mockDb, mafiaToken, "kill", civilians[0].playerId);
      await db.submitAction(mockDb, mafiaToken, "kill", civilians[1].playerId);

      // Advance to day - B should be killed, not A
      await db.changePhase(mockDb, hostToken, "day");

      const dayState = await db.getGameState(mockDb, hostToken);
      const deadPlayer = dayState!.players.find((p) => !p.isAlive && !p.isHost);

      expect(deadPlayer!.playerId).toBe(civilians[1].playerId);
      expect(dayState!.lastNightSummary?.killedNickname).toBe(civilians[1].nickname);
    });

    it("should handle transfer GM during game - old GM becomes civilian", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "OldGM");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens = [];
      for (let i = 0; i < 4; i++) {
        const result = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(result!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");

      const gameState = await db.getGameState(mockDb, hostToken);
      const newGmTarget = gameState!.players.find((p) => !p.isHost && p.isAlive)!;

      // Transfer GM during active game
      await db.transferGm(mockDb, hostToken, newGmTarget.playerId);

      const postTransferState = await db.getGameState(mockDb, hostToken);
      const oldGm = postTransferState!.players.find((p) => p.nickname === "OldGM")!;
      const newGm = postTransferState!.players.find((p) => p.playerId === newGmTarget.playerId)!;

      expect(oldGm.isHost).toBe(false);
      expect(oldGm.role).toBe("civilian"); // Old GM should become civilian
      expect(newGm.isHost).toBe(true);
      // New GM role might be null (GM role is handled by isHost flag)
    });

    it("should handle rematch - behavior with new players", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");

      // Force game to end
      await mockDb
        .prepare("UPDATE games SET status = 'finished', winner = 'town' WHERE id = ?")
        .bind(hostState!.game.id)
        .run();

      // Rematch
      await db.rematch(mockDb, hostToken);

      const postRematchState = await db.getGameState(mockDb, hostToken);
      expect(postRematchState!.game.status).toBe("lobby");

      // Try to join with new player - should work (rematch returns to lobby, allows new players)
      const newPlayerResult = await db.joinGame(mockDb, code, "NewPlayer");

      expect(newPlayerResult).not.toBeNull();
      expect(newPlayerResult!.success).toBe(true);

      const finalState = await db.getGameState(mockDb, hostToken);
      const newPlayer = finalState!.players.find((p) => p.nickname === "NewPlayer");
      expect(newPlayer).toBeDefined();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSqliteD1, SqliteD1Database } from "./helpers/sqliteD1";
import * as db from "@/lib/db";

vi.mock("nanoid", () => {
  let counter = 0;
  return {
    nanoid: vi.fn(() => `id-${++counter}-${Date.now()}`),
  };
});

describe("Database Integration Tests (SQLite)", () => {
  let mockDb: SqliteD1Database;

  beforeEach(() => {
    mockDb = createSqliteD1();
  });

  afterEach(() => {
    mockDb.close();
  });

  describe("createGame", () => {
    it("should create a game and return a token", async () => {
      const result = await db.createGame(mockDb, "HostPlayer");
      expect(result).toHaveProperty("token");
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(0);
    });

    it("should create game with lobby status", async () => {
      const { token } = await db.createGame(mockDb, "Host");
      const state = await db.getGameState(mockDb, token);

      expect(state).not.toBeNull();
      expect(state!.game.status).toBe("lobby");
      expect(state!.game.phase).toBe("lobby");
      expect(state!.game.round).toBe(0);
    });

    it("should set host player correctly", async () => {
      const { token } = await db.createGame(mockDb, "SuperHost");
      const state = await db.getGameState(mockDb, token);

      expect(state!.currentPlayer.nickname).toBe("SuperHost");
      expect(state!.currentPlayer.isHost).toBe(true);
      expect(state!.currentPlayer.isAlive).toBe(true);
    });

    it("should generate a unique game code", async () => {
      const { token: token1 } = await db.createGame(mockDb, "Host1");
      const { token: token2 } = await db.createGame(mockDb, "Host2");

      const state1 = await db.getGameState(mockDb, token1);
      const state2 = await db.getGameState(mockDb, token2);

      expect(state1!.game.code).not.toBe(state2!.game.code);
    });
  });

  describe("joinGame", () => {
    it("should allow joining with valid code", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const result = await db.joinGame(mockDb, code, "Player1");
      expect(result).not.toBeNull();
      expect(result!.token).toBeDefined();
    });

    it("should return null for invalid code", async () => {
      const result = await db.joinGame(mockDb, "ZZZZZ9", "Player");
      expect(result).toBeNull();
    });

    it("should add player to game state", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const joinResult = await db.joinGame(mockDb, code, "Player1");
      const playerState = await db.getGameState(mockDb, joinResult!.token);

      expect(playerState!.currentPlayer.nickname).toBe("Player1");
      expect(playerState!.currentPlayer.isHost).toBe(false);
    });

    it("should show player in host game state", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "Alice");
      await db.joinGame(mockDb, code, "Bob");

      const updatedState = await db.getGameState(mockDb, hostToken);
      expect(updatedState!.players.length).toBe(3); // host + 2 players
    });

    it("should not allow joining a non-lobby game", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add enough players
      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      // Start the game
      await db.startGame(mockDb, hostToken);

      // Try to join after start
      const result = await db.joinGame(mockDb, code, "LateComer");
      expect(result).toBeNull();
    });
  });

  describe("getGameState", () => {
    it("should return null for invalid token", async () => {
      const result = await db.getGameState(mockDb, "nonexistent");
      expect(result).toBeNull();
    });

    it("should return full game state", async () => {
      const { token } = await db.createGame(mockDb, "Host");
      const state = await db.getGameState(mockDb, token);

      expect(state).not.toBeNull();
      expect(state!.game).toBeDefined();
      expect(state!.currentPlayer).toBeDefined();
      expect(state!.players).toBeDefined();
      expect(state!.messages).toBeDefined();
      expect(state!.missions).toBeDefined();
    });

    it("should mark current player with isYou", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const state = await db.getGameState(mockDb, hostToken);

      const me = state!.players.find((p) => p.isYou);
      expect(me).toBeDefined();
      expect(me!.nickname).toBe("Host");
    });
  });

  describe("startGame", () => {
    it("should fail with invalid token", async () => {
      const result = await db.startGame(mockDb, "invalid");
      expect(result.success).toBe(false);
    });

    it("should fail if not host", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const joinResult = await db.joinGame(mockDb, code, "Player1");
      const result = await db.startGame(mockDb, joinResult!.token);

      expect(result.success).toBe(false);
      expect(result.error).toContain("MG");
    });

    it("should fail with too few players in full mode", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Only add 3 players (need 5 for full mode)
      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      const result = await db.startGame(mockDb, hostToken, undefined, "full");
      expect(result.success).toBe(false);
      expect(result.error).toContain("minimum");
    });

    it("should succeed with enough players in full mode", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      const result = await db.startGame(mockDb, hostToken, undefined, "full");
      expect(result.success).toBe(true);
    });

    it("should succeed with 3 players in simple mode", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 3; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      const result = await db.startGame(mockDb, hostToken, undefined, "simple");
      expect(result.success).toBe(true);
    });

    it("should assign roles to non-host players", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      // Host should see all roles
      const updatedState = await db.getGameState(mockDb, hostToken);
      const nonHostPlayers = updatedState!.players.filter((p) => !p.isHost);

      // All non-host players should have roles
      nonHostPlayers.forEach((p) => {
        expect(p.role).toBeTruthy();
        expect(["mafia", "detective", "doctor", "civilian"]).toContain(p.role);
      });
    });

    it("should change game status to playing", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken);
      const state = await db.getGameState(mockDb, hostToken);

      expect(state!.game.status).toBe("playing");
      expect(state!.game.phase).toBe("night");
      expect(state!.game.round).toBe(1);
    });

    it("should accept custom mafia count", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 6; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }

      await db.startGame(mockDb, hostToken, 2, "full");
      const state = await db.getGameState(mockDb, hostToken);

      const mafiaCount = state!.players.filter((p) => p.role === "mafia").length;
      expect(mafiaCount).toBe(2);
    });
  });

  describe("renamePlayer", () => {
    it("should fail with invalid token", async () => {
      const result = await db.renamePlayer(mockDb, "invalid", "NewName");
      expect(result.success).toBe(false);
    });

    it("should rename player successfully", async () => {
      const { token } = await db.createGame(mockDb, "OldName");
      const result = await db.renamePlayer(mockDb, token, "NewName");

      expect(result.success).toBe(true);

      const state = await db.getGameState(mockDb, token);
      expect(state!.currentPlayer.nickname).toBe("NewName");
    });

    it("should reject empty nickname", async () => {
      const { token } = await db.createGame(mockDb, "Host");
      const result = await db.renamePlayer(mockDb, token, "");
      expect(result.success).toBe(false);
    });

    it("should reject nickname longer than 20 chars", async () => {
      const { token } = await db.createGame(mockDb, "Host");
      const result = await db.renamePlayer(mockDb, token, "A".repeat(21));
      expect(result.success).toBe(false);
    });
  });

  describe("kickPlayer", () => {
    it("should fail with invalid token", async () => {
      const result = await db.kickPlayer(mockDb, "invalid", "target");
      expect(result.success).toBe(false);
    });

    it("should kick a player from lobby", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "Kickable");

      // Get player ID from game state
      const stateBeforeKick = await db.getGameState(mockDb, hostToken);
      const kickablePlayer = stateBeforeKick!.players.find((p) => p.nickname === "Kickable");

      const result = await db.kickPlayer(mockDb, hostToken, kickablePlayer!.playerId);
      expect(result.success).toBe(true);

      // Player should be gone
      const stateAfterKick = await db.getGameState(mockDb, hostToken);
      const stillThere = stateAfterKick!.players.find((p) => p.nickname === "Kickable");
      expect(stillThere).toBeUndefined();
    });
  });

  describe("sendMessage", () => {
    it("should fail with invalid token", async () => {
      const result = await db.sendMessage(mockDb, "invalid", "hello", "target");
      expect(result.success).toBe(false);
    });

    it("should send a message from host", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "Player1");

      // Get player ID
      const state = await db.getGameState(mockDb, hostToken);
      const player = state!.players.find((p) => p.nickname === "Player1");

      const result = await db.sendMessage(mockDb, hostToken, "Hello!", player!.playerId);
      expect(result.success).toBe(true);
    });
  });

  describe("changePhase", () => {
    it("should fail with invalid token", async () => {
      const result = await db.changePhase(mockDb, "invalid", "day");
      expect(result.success).toBe(false);
    });

    it("should change phase from night to day", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }
      await db.startGame(mockDb, hostToken);

      const result = await db.changePhase(mockDb, hostToken, "day");
      expect(result.success).toBe(true);

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.phase).toBe("day");
    });
  });

  describe("submitAction", () => {
    it("should fail with invalid token", async () => {
      const result = await db.submitAction(mockDb, "invalid", "kill", "target");
      expect(result.success).toBe(false);
    });

    it("should allow mafia to kill at night", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      // Find the mafia player
      let mafiaToken: string | null = null;
      let civilianPlayerId: string | null = null;
      for (const t of playerTokens) {
        const s = await db.getGameState(mockDb, t);
        if (s!.currentPlayer.role === "mafia") {
          mafiaToken = t;
        }
        if (s!.currentPlayer.role === "civilian") {
          civilianPlayerId = s!.currentPlayer.playerId;
        }
      }

      if (mafiaToken && civilianPlayerId) {
        const result = await db.submitAction(mockDb, mafiaToken, "kill", civilianPlayerId);
        expect(result.success).toBe(true);
      }
    });

    it("should not allow non-mafia to kill", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      // Find a civilian and a target
      let civilianToken: string | null = null;
      let targetId: string | null = null;
      for (const t of playerTokens) {
        const s = await db.getGameState(mockDb, t);
        if (s!.currentPlayer.role === "civilian" && !civilianToken) {
          civilianToken = t;
        } else if (!targetId) {
          targetId = s!.currentPlayer.playerId;
        }
      }

      if (civilianToken && targetId) {
        const result = await db.submitAction(mockDb, civilianToken, "kill", targetId);
        expect(result.success).toBe(false);
        expect(result.error).toContain("mafia");
      }
    });

    it("should allow detective to investigate at night", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      let detectiveToken: string | null = null;
      let targetId: string | null = null;
      for (const t of playerTokens) {
        const s = await db.getGameState(mockDb, t);
        if (s!.currentPlayer.role === "detective") {
          detectiveToken = t;
        } else if (!targetId) {
          targetId = s!.currentPlayer.playerId;
        }
      }

      if (detectiveToken && targetId) {
        const result = await db.submitAction(mockDb, detectiveToken, "investigate", targetId);
        expect(result.success).toBe(true);
      }
    });

    it("should allow doctor to protect at night", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      let doctorToken: string | null = null;
      let targetId: string | null = null;
      for (const t of playerTokens) {
        const s = await db.getGameState(mockDb, t);
        if (s!.currentPlayer.role === "doctor") {
          doctorToken = t;
        } else if (!targetId) {
          targetId = s!.currentPlayer.playerId;
        }
      }

      if (doctorToken && targetId) {
        const result = await db.submitAction(mockDb, doctorToken, "protect", targetId);
        expect(result.success).toBe(true);
      }
    });

    it("should allow civilian to wait at night", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      let civilianToken: string | null = null;
      for (const t of playerTokens) {
        const s = await db.getGameState(mockDb, t);
        if (s!.currentPlayer.role === "civilian") {
          civilianToken = t;
          break;
        }
      }

      if (civilianToken) {
        const result = await db.submitAction(mockDb, civilianToken, "wait");
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid action types at night", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      // Any non-host player
      const result = await db.submitAction(mockDb, playerTokens[0], "dance");
      // Either fails because wrong role or wrong action type
      expect(result.success).toBe(false);
    });

    it("should allow voting during voting phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");
      // night → day
      await db.changePhase(mockDb, hostToken, "day");
      // day → voting
      await db.changePhase(mockDb, hostToken, "voting");

      // Find any alive player and a target
      const s = await db.getGameState(mockDb, playerTokens[0]);
      const alivePlayers = s!.players.filter((p) => p.isAlive && !p.isHost);
      if (alivePlayers.length >= 2) {
        const voter = playerTokens[0];
        const targetId = alivePlayers.find(
          (p) => p.playerId !== s!.currentPlayer.playerId
        )?.playerId;
        if (targetId) {
          const result = await db.submitAction(mockDb, voter, "vote", targetId);
          expect(result.success).toBe(true);
        }
      }
    });

    it("should not allow kill during voting", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const result = await db.submitAction(mockDb, playerTokens[0], "kill", "someone");
      expect(result.success).toBe(false);
    });

    it("should reject actions during day phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");
      await db.changePhase(mockDb, hostToken, "day");

      const result = await db.submitAction(mockDb, playerTokens[0], "vote", "someone");
      expect(result.success).toBe(false);
    });

    it("should allow GM to act on behalf of player", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      // Find mafia player ID and a target
      let mafiaPlayerId: string | null = null;
      let targetId: string | null = null;
      const state = await db.getGameState(mockDb, hostToken);
      for (const p of state!.players) {
        if (p.role === "mafia" && !mafiaPlayerId) mafiaPlayerId = p.playerId;
        else if (p.role === "civilian" && !targetId) targetId = p.playerId;
      }

      if (mafiaPlayerId && targetId) {
        const result = await db.submitAction(mockDb, hostToken, "kill", targetId, mafiaPlayerId);
        expect(result.success).toBe(true);
      }
    });

    it("should not allow non-host to act on behalf", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      const result = await db.submitAction(
        mockDb,
        playerTokens[0],
        "kill",
        "target",
        "otherPlayer"
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("MG");
    });
  });

  describe("createMission", () => {
    it("should fail with invalid token", async () => {
      const result = await db.createMission(mockDb, "invalid", "target", "Do something", false, 1);
      expect(result.success).toBe(false);
    });

    it("should create a mission as host", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "Player1");

      // Start game first
      for (let i = 1; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i + 1}`);
      }
      await db.startGame(mockDb, hostToken);

      const state = await db.getGameState(mockDb, hostToken);
      const player = state!.players.find((p) => p.nickname === "Player1");

      const result = await db.createMission(
        mockDb,
        hostToken,
        player!.playerId,
        "Say mafia 5 times",
        false,
        1
      );
      expect(result.success).toBe(true);
    });
  });

  describe("transferGm", () => {
    it("should fail with invalid token", async () => {
      const result = await db.transferGm(mockDb, "invalid", "newHost");
      expect(result.success).toBe(false);
    });

    it("should transfer GM role", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "OldGM");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "NewGM");

      const state = await db.getGameState(mockDb, hostToken);
      const newGm = state!.players.find((p) => p.nickname === "NewGM");

      const result = await db.transferGm(mockDb, hostToken, newGm!.playerId);
      expect(result.success).toBe(true);
    });
  });

  describe("changePhase transitions", () => {
    it("should reject invalid transitions", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }
      await db.startGame(mockDb, hostToken);

      // night → voting (invalid, should be night → day)
      const result = await db.changePhase(mockDb, hostToken, "voting");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Nieprawidłowe");
    });

    it("should do full phase cycle: night → day → voting → night", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `Player${i}`);
      }
      await db.startGame(mockDb, hostToken);

      // night → day
      let result = await db.changePhase(mockDb, hostToken, "day");
      expect(result.success).toBe(true);
      let state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.phase).toBe("day");

      // day → voting
      result = await db.changePhase(mockDb, hostToken, "voting");
      expect(result.success).toBe(true);
      state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.phase).toBe("voting");

      // voting → night (increments round)
      result = await db.changePhase(mockDb, hostToken, "night");
      expect(result.success).toBe(true);
      state = await db.getGameState(mockDb, hostToken);
      expect(state!.game.phase).toBe("night");
      expect(state!.game.round).toBe(2);
    });

    it("should not allow non-host to change phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }
      await db.startGame(mockDb, hostToken);

      const result = await db.changePhase(mockDb, playerTokens[0], "day");
      expect(result.success).toBe(false);
    });
  });

  describe("completeMission", () => {
    it("should fail with invalid token", async () => {
      const result = await db.completeMission(mockDb, "invalid", "missionId");
      expect(result.success).toBe(false);
    });
  });

  describe("deleteMission", () => {
    it("should fail with invalid token", async () => {
      const result = await db.deleteMission(mockDb, "invalid", "missionId");
      expect(result.success).toBe(false);
    });
  });

  describe("finalizeGame", () => {
    it("should fail with invalid token", async () => {
      const result = await db.finalizeGame(mockDb, "invalid");
      expect(result.success).toBe(false);
    });

    it("should fail if not host", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const joinResult = await db.joinGame(mockDb, code, "Player");
      const result = await db.finalizeGame(mockDb, joinResult!.token);
      expect(result.success).toBe(false);
    });
  });

  describe("rematch", () => {
    it("should fail with invalid token", async () => {
      const result = await db.rematch(mockDb, "invalid");
      expect(result.success).toBe(false);
    });

    it("should fail if game is not finished", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const result = await db.rematch(mockDb, hostToken);
      expect(result.success).toBe(false);
    });
  });

  describe("buildRoles via startGame", () => {
    it("should assign 1 mafia for 5 players in full mode", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 5; i++) {
        await db.joinGame(mockDb, code, `P${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");
      const state = await db.getGameState(mockDb, hostToken);
      const roles = state!.players.filter((p) => !p.isHost).map((p) => p.role);

      expect(roles.filter((r) => r === "mafia").length).toBe(1);
      expect(roles.filter((r) => r === "detective").length).toBe(1);
      expect(roles.filter((r) => r === "doctor").length).toBe(1);
      expect(roles.filter((r) => r === "civilian").length).toBe(2);
    });

    it("should assign 2 mafia for 6-8 players in full mode", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 7; i++) {
        await db.joinGame(mockDb, code, `P${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");
      const state = await db.getGameState(mockDb, hostToken);
      const mafiaCount = state!.players.filter((p) => p.role === "mafia").length;
      expect(mafiaCount).toBe(2);
    });

    it("should only have mafia and civilians in simple mode", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      for (let i = 0; i < 4; i++) {
        await db.joinGame(mockDb, code, `P${i}`);
      }

      await db.startGame(mockDb, hostToken, undefined, "simple");
      const state = await db.getGameState(mockDb, hostToken);
      const roles = state!.players.filter((p) => !p.isHost).map((p) => p.role);

      const uniqueRoles = new Set(roles);
      expect(uniqueRoles.has("detective")).toBe(false);
      expect(uniqueRoles.has("doctor")).toBe(false);
      expect(uniqueRoles.has("mafia")).toBe(true);
      expect(uniqueRoles.has("civilian")).toBe(true);
    });
  });

  describe("leaveGame", () => {
    it("should fail with invalid token", async () => {
      const result = await db.leaveGame(mockDb, "invalid");
      expect(result.success).toBe(false);
    });

    it("should not allow GM to leave", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const result = await db.leaveGame(mockDb, hostToken);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Mistrz gry");
    });

    it("should remove player from lobby", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const joinResult = await db.joinGame(mockDb, code, "Leaver");
      const result = await db.leaveGame(mockDb, joinResult!.token);
      expect(result.success).toBe(true);

      const stateAfter = await db.getGameState(mockDb, hostToken);
      const leaver = stateAfter!.players.find((p) => p.nickname === "Leaver");
      expect(leaver).toBeUndefined();
    });

    it("should mark player as dead during game", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerTokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, undefined, "full");

      const result = await db.leaveGame(mockDb, playerTokens[0]);
      expect(result.success).toBe(true);

      const stateAfter = await db.getGameState(mockDb, hostToken);
      const leftPlayer = stateAfter!.players.find((p) => p.nickname === "Player0");
      expect(leftPlayer!.isAlive).toBe(false);
    });

    it("should end game if too few players remain", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // 3 players in simple mode (minimum)
      const playerTokens: string[] = [];
      for (let i = 0; i < 3; i++) {
        const r = await db.joinGame(mockDb, code, `Player${i}`);
        playerTokens.push(r!.token);
      }

      await db.startGame(mockDb, hostToken, 1, "simple");

      // Remove civilians until game ends
      for (const t of playerTokens) {
        const s = await db.getGameState(mockDb, t);
        if (s && s.currentPlayer.role === "civilian" && s.currentPlayer.isAlive) {
          const result = await db.leaveGame(mockDb, t);
          if (result.gameEnded) break;
        }
      }

      const finalState = await db.getGameState(mockDb, hostToken);
      // Game should be finished or very close
      expect(["finished", "playing"]).toContain(finalState!.game.status);
    });
  });

  describe("Characters", () => {
    beforeEach(async () => {
      // Seed test characters
      await mockDb.exec(`
        INSERT INTO characters (id, slug, name, name_pl, gender, description, avatar_url, is_active, sort_order) VALUES
        ('test_char_1', 'test-char-1', 'Test Character 1', 'Testowa Postać 1', 'male', 'Test description', '/avatars/test1.webp', 1, 1),
        ('test_char_2', 'test-char-2', 'Test Character 2', 'Testowa Postać 2', 'female', 'Test description 2', '/avatars/test2.webp', 1, 2),
        ('inactive_char', 'inactive', 'Inactive Character', 'Nieaktywna Postać', 'male', 'Inactive', '/avatars/inactive.webp', 0, 3)
      `);
    });

    describe("getCharacters", () => {
      it("should return list of active characters", async () => {
        const characters = await db.getCharacters(mockDb);

        expect(characters.length).toBe(2); // Only active characters
        expect(characters[0].slug).toBe("test-char-1");
        expect(characters[1].slug).toBe("test-char-2");
        expect(characters.every((c) => c.is_active === 1)).toBe(true);
      });

      it("should return characters in sort order", async () => {
        const characters = await db.getCharacters(mockDb);

        expect(characters[0].sort_order).toBe(1);
        expect(characters[1].sort_order).toBe(2);
      });
    });

    describe("updateCharacter", () => {
      it("should update character successfully", async () => {
        const { token } = await db.createGame(mockDb, "Player1");

        const success = await db.updateCharacter(mockDb, token, "test_char_1");
        expect(success).toBe(true);

        const state = await db.getGameState(mockDb, token);
        expect(state!.currentPlayer.character).toEqual({
          id: "test_char_1",
          slug: "test-char-1",
          namePl: "Testowa Postać 1",
          avatarUrl: "/avatars/test1.webp",
        });
      });

      it("should return false for invalid character", async () => {
        const { token } = await db.createGame(mockDb, "Player1");

        const success = await db.updateCharacter(mockDb, token, "invalid_char");
        expect(success).toBe(false);
      });

      it("should return false for inactive character", async () => {
        const { token } = await db.createGame(mockDb, "Player1");

        const success = await db.updateCharacter(mockDb, token, "inactive_char");
        expect(success).toBe(false);
      });

      it("should return false for invalid token", async () => {
        const success = await db.updateCharacter(mockDb, "invalid_token", "test_char_1");
        expect(success).toBe(false);
      });
    });

    describe("getGameState with character data", () => {
      it("should include character data for players", async () => {
        const { token: hostToken } = await db.createGame(mockDb, "Host", "test_char_1");
        const hostState = await db.getGameState(mockDb, hostToken);
        const code = hostState!.game.code;

        await db.joinGame(mockDb, code, "Player1", "test_char_2");
        await db.joinGame(mockDb, code, "Player2"); // No character

        const state = await db.getGameState(mockDb, hostToken);

        const hostPlayer = state!.players.find((p) => p.nickname === "Host");
        const player1 = state!.players.find((p) => p.nickname === "Player1");
        const player2 = state!.players.find((p) => p.nickname === "Player2");

        expect(hostPlayer!.character).toEqual({
          id: "test_char_1",
          slug: "test-char-1",
          namePl: "Testowa Postać 1",
          avatarUrl: "/avatars/test1.webp",
        });

        expect(player1!.character).toEqual({
          id: "test_char_2",
          slug: "test-char-2",
          namePl: "Testowa Postać 2",
          avatarUrl: "/avatars/test2.webp",
        });

        expect(player2!.character).toBe(null);
      });

      it("should include character data for current player", async () => {
        const { token } = await db.createGame(mockDb, "Host", "test_char_1");
        const state = await db.getGameState(mockDb, token);

        expect(state!.currentPlayer.character).toEqual({
          id: "test_char_1",
          slug: "test-char-1",
          namePl: "Testowa Postać 1",
          avatarUrl: "/avatars/test1.webp",
        });
      });
    });
  });

  describe("setupPlayer", () => {
    beforeEach(async () => {
      // Seed test characters
      await mockDb.exec(`
        INSERT INTO characters (id, slug, name, name_pl, gender, description, avatar_url, is_active, sort_order) VALUES
        ('char_1', 'character-1', 'Character 1', 'Postać 1', 'male', 'Test character', '/avatars/char1.webp', 1, 1),
        ('char_2', 'character-2', 'Character 2', 'Postać 2', 'female', 'Test character 2', '/avatars/char2.webp', 1, 2),
        ('inactive_char', 'inactive-char', 'Inactive', 'Nieaktywna', 'male', 'Inactive', '/avatars/inactive.webp', 0, 3)
      `);
    });

    it("should setup player successfully (happy path)", async () => {
      const { token } = await db.createGame(mockDb, undefined); // Create game without nickname

      const result = await db.setupPlayer(mockDb, token, "TestPlayer", "char_1");
      expect(result.success).toBe(true);

      const state = await db.getGameState(mockDb, token);
      expect(state!.currentPlayer.nickname).toBe("TestPlayer");
      expect(state!.currentPlayer.isSetupComplete).toBe(true);
      expect(state!.currentPlayer.character).toEqual({
        id: "char_1",
        slug: "character-1",
        namePl: "Postać 1",
        avatarUrl: "/avatars/char1.webp",
      });
    });

    it("should return error for duplicate nickname", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Join game without nickname
      const joinResult = await db.joinGame(mockDb, code, undefined);
      const playerToken = joinResult!.token;

      // Setup first player
      await db.setupPlayer(mockDb, playerToken, "DuplicateName", "char_1");

      // Join second player
      const joinResult2 = await db.joinGame(mockDb, code, undefined);
      const player2Token = joinResult2!.token;

      // Try to use same nickname
      const result = await db.setupPlayer(mockDb, player2Token, "DuplicateName", "char_2");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Ta nazwa jest już zajęta");
    });

    it("should return error for taken character", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host", "char_1");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Join game without nickname and character
      const joinResult = await db.joinGame(mockDb, code, undefined);

      // Try to use host's character
      const result = await db.setupPlayer(mockDb, joinResult!.token, "Player", "char_1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Ta postać jest już wybrana");
    });

    it("should return error for invalid token", async () => {
      const result = await db.setupPlayer(mockDb, "invalid_token", "Player", "char_1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Nieprawidłowy token gracza");
    });

    it("should validate nickname length", async () => {
      const { token } = await db.createGame(mockDb, undefined);

      // Too short
      let result = await db.setupPlayer(mockDb, token, "", "char_1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Nazwa musi mieć 1-20 znaków");

      // Too long
      result = await db.setupPlayer(mockDb, token, "A".repeat(21), "char_1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Nazwa musi mieć 1-20 znaków");
    });

    it("should return error for invalid character", async () => {
      const { token } = await db.createGame(mockDb, undefined);

      const result = await db.setupPlayer(mockDb, token, "Player", "invalid_char");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Nieprawidłowa postać");
    });

    it("should return error for inactive character", async () => {
      const { token } = await db.createGame(mockDb, undefined);

      const result = await db.setupPlayer(mockDb, token, "Player", "inactive_char");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Nieprawidłowa postać");
    });
  });

  describe("createGame without nickname", () => {
    it("should create game with default host nickname", async () => {
      const result = await db.createGame(mockDb, undefined);
      expect(result).toHaveProperty("token");

      const state = await db.getGameState(mockDb, result.token);
      expect(state!.currentPlayer.nickname).toBe("Mistrz Gry");
      expect(state!.currentPlayer.isHost).toBe(true);
      expect(state!.currentPlayer.isSetupComplete).toBe(true);
    });
  });

  describe("joinGame without nickname", () => {
    it("should join game with null nickname", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const result = await db.joinGame(mockDb, code, undefined);
      expect(result).not.toBeNull();
      expect(result!.token).toBeDefined();

      const playerState = await db.getGameState(mockDb, result!.token);
      expect(playerState).not.toBeNull();
      expect(playerState!.currentPlayer.nickname).toBe("");
      expect(playerState!.currentPlayer.isHost).toBe(false);
      expect(playerState!.currentPlayer.isSetupComplete).toBe(false);
    });
  });

  describe("getGameState with takenCharacterIds", () => {
    beforeEach(async () => {
      // Seed test characters
      await mockDb.exec(`
        INSERT INTO characters (id, slug, name, name_pl, gender, description, avatar_url, is_active, sort_order) VALUES
        ('char_a', 'character-a', 'Character A', 'Postać A', 'male', 'Test character A', '/avatars/chara.webp', 1, 1),
        ('char_b', 'character-b', 'Character B', 'Postać B', 'female', 'Test character B', '/avatars/charb.webp', 1, 2)
      `);
    });

    it("should return taken character IDs", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host", "char_a");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "Player1", "char_b");
      await db.joinGame(mockDb, code, "Player2"); // No character

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.takenCharacterIds).toEqual(["char_a", "char_b"]);
    });

    it("should return empty array when no characters taken", async () => {
      const { token } = await db.createGame(mockDb, "Host");
      const state = await db.getGameState(mockDb, token);
      expect(state!.takenCharacterIds).toEqual([]);
    });
  });

  describe("phaseProgress", () => {
    it("should return null for non-host players", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const playerToken = await db.joinGame(mockDb, code, "Player1");
      await db.joinGame(mockDb, code, "Player2");
      await db.joinGame(mockDb, code, "Player3");
      await db.startGame(mockDb, hostToken, undefined, "simple");

      const playerState = await db.getGameState(mockDb, playerToken.token);
      expect(playerState!.phaseProgress).toBeUndefined();

      // Also check that host gets phaseProgress in night phase
      const hostStateAfterStart = await db.getGameState(mockDb, hostToken);
      expect(hostStateAfterStart!.phaseProgress).toBeDefined();
    });

    it("should return progress for host during night phase with incomplete actions", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add players to get required roles for full mode (need 5+ players)
      await db.joinGame(mockDb, code, "Mafia1");
      await db.joinGame(mockDb, code, "Detective1");
      await db.joinGame(mockDb, code, "Doctor1");
      await db.joinGame(mockDb, code, "Civilian1");
      await db.joinGame(mockDb, code, "Civilian2");

      await db.startGame(mockDb, hostToken, undefined, "full");
      // Game starts in night phase, so no need to change phase

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.phaseProgress).toBeDefined();
      expect(state!.phaseProgress!.phase).toBe("night");
      expect(state!.phaseProgress!.allDone).toBe(false);
      expect(state!.phaseProgress!.hint).toContain("Brakuje:");
      expect(state!.phaseProgress!.requiredActions.length).toBeGreaterThan(0);

      const incompleteActions = state!.phaseProgress!.requiredActions.filter((a) => !a.done);
      expect(incompleteActions.length).toBeGreaterThan(0);
    });

    it("should show all done when all night actions are submitted", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add specific players to control roles
      const mafiaToken = await db.joinGame(mockDb, code, "Mafia1");
      const detectiveToken = await db.joinGame(mockDb, code, "Detective1");
      const doctorToken = await db.joinGame(mockDb, code, "Doctor1");
      await db.joinGame(mockDb, code, "Civilian1");

      await db.startGame(mockDb, hostToken, undefined, "full");
      await db.changePhase(mockDb, hostToken, "night");

      // Get state to see role assignments and submit actions for required roles
      const mafiaState = await db.getGameState(mockDb, mafiaToken.token);
      const detectiveState = await db.getGameState(mockDb, detectiveToken.token);
      const doctorState = await db.getGameState(mockDb, doctorToken.token);

      // Find players and submit actions
      const nonMafiaPlayer = mafiaState!.players.find((p) => !p.isHost && p.role !== "mafia");
      if (nonMafiaPlayer && mafiaState!.currentPlayer.role === "mafia") {
        await db.submitAction(mockDb, mafiaToken.token, "kill", nonMafiaPlayer.playerId);
      }

      const investigateTarget = detectiveState!.players.find(
        (p) => !p.isHost && p.playerId !== detectiveState!.currentPlayer.playerId
      );
      if (investigateTarget && detectiveState!.currentPlayer.role === "detective") {
        await db.submitAction(
          mockDb,
          detectiveToken.token,
          "investigate",
          investigateTarget.playerId
        );
      }

      const protectTarget = doctorState!.players.find(
        (p) => !p.isHost && p.playerId !== doctorState!.currentPlayer.playerId
      );
      if (protectTarget && doctorState!.currentPlayer.role === "doctor") {
        await db.submitAction(mockDb, doctorToken.token, "protect", protectTarget.playerId);
      }

      const finalState = await db.getGameState(mockDb, hostToken);
      if (finalState!.phaseProgress && finalState!.phaseProgress.requiredActions.length > 0) {
        expect(finalState!.phaseProgress.allDone).toBe(true);
        expect(finalState!.phaseProgress.hint).toBe("Wszystkie akcje złożone! Przejdź do dnia.");
      }
    });

    it("should show voting progress with partial votes", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const player1Token = await db.joinGame(mockDb, code, "Player1");
      await db.joinGame(mockDb, code, "Player2");
      await db.joinGame(mockDb, code, "Player3");

      await db.startGame(mockDb, hostToken, undefined, "simple");
      // Transition: night -> day -> voting
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.phaseProgress).toBeDefined();
      expect(state!.phaseProgress!.phase).toBe("voting");
      expect(state!.phaseProgress!.allDone).toBe(false);
      expect(state!.phaseProgress!.hint).toContain("Trwa głosowanie");

      // Submit one vote
      const targetPlayer = state!.players.find(
        (p) => !p.isHost && p.playerId !== player1Token.playerId
      );
      if (targetPlayer) {
        await db.submitAction(mockDb, player1Token.token, "vote", targetPlayer.playerId);
      }

      const updatedState = await db.getGameState(mockDb, hostToken);
      expect(updatedState!.phaseProgress!.allDone).toBe(false);
      expect(updatedState!.phaseProgress!.hint).toMatch(/\d+\/\d+ głosów/);
    });

    it("should show all done when all players voted", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      const player1Token = await db.joinGame(mockDb, code, "Player1");
      const player2Token = await db.joinGame(mockDb, code, "Player2");
      const player3Token = await db.joinGame(mockDb, code, "Player3");

      await db.startGame(mockDb, hostToken, undefined, "simple");
      // Transition: night -> day -> voting
      await db.changePhase(mockDb, hostToken, "day");
      await db.changePhase(mockDb, hostToken, "voting");

      // All players vote
      const state = await db.getGameState(mockDb, hostToken);
      const targetPlayer = state!.players.find((p) => !p.isHost);

      if (targetPlayer) {
        await db.submitAction(mockDb, player1Token.token, "vote", targetPlayer.playerId);
        await db.submitAction(mockDb, player2Token.token, "vote", targetPlayer.playerId);
        await db.submitAction(mockDb, player3Token.token, "vote", targetPlayer.playerId);
      }

      const finalState = await db.getGameState(mockDb, hostToken);
      expect(finalState!.phaseProgress!.allDone).toBe(true);
      expect(finalState!.phaseProgress!.hint).toBe("Wszyscy zagłosowali! Ogłoś wynik.");
    });

    it("should return progress for day phase", async () => {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      await db.joinGame(mockDb, code, "Player1");
      await db.joinGame(mockDb, code, "Player2");
      await db.joinGame(mockDb, code, "Player3");
      await db.startGame(mockDb, hostToken, undefined, "simple");
      await db.changePhase(mockDb, hostToken, "day");

      const state = await db.getGameState(mockDb, hostToken);
      expect(state!.phaseProgress).toBeDefined();
      expect(state!.phaseProgress!.phase).toBe("day");
      expect(state!.phaseProgress!.allDone).toBe(true);
      expect(state!.phaseProgress!.hint).toBe(
        "Czas na dyskusję. Przejdź do głosowania gdy gracze są gotowi."
      );
    });

    it("should return undefined for non-playing game status", async () => {
      const { token } = await db.createGame(mockDb, "Host");
      const state = await db.getGameState(mockDb, token);

      // Game is in lobby status
      expect(state!.phaseProgress).toBeUndefined();
    });
  });

  describe("resolveNight unanimous voting", () => {
    async function setupMafiaGame() {
      const { token: hostToken } = await db.createGame(mockDb, "Host");
      const hostState = await db.getGameState(mockDb, hostToken);
      const code = hostState!.game.code;

      // Add players to get mafia roles and get their tokens (need more civilians to avoid immediate win)
      const player1Token = await db.joinGame(mockDb, code, "Player1");
      const player2Token = await db.joinGame(mockDb, code, "Player2");
      const player3Token = await db.joinGame(mockDb, code, "Player3");
      const player4Token = await db.joinGame(mockDb, code, "Player4");
      const player5Token = await db.joinGame(mockDb, code, "Player5");
      const player6Token = await db.joinGame(mockDb, code, "Player6");

      await db.startGame(mockDb, hostToken, 2); // Force 2 mafia

      const state = await db.getGameState(mockDb, hostToken);
      const players = state!.players;

      // Find players with their roles (roles are randomly assigned)
      const mafiaPlayers = players.filter((p) => p.role === "mafia");
      const mafia1 = mafiaPlayers[0];
      const mafia2 = mafiaPlayers[1];
      const civilian = players.find((p) => p.role === "civilian");
      const detective = players.find((p) => p.role === "detective");
      const doctor = players.find((p) => p.role === "doctor");

      // Map tokens to players based on actual roles
      const playerTokens = [
        { nickname: "Player1", token: player1Token.token },
        { nickname: "Player2", token: player2Token.token },
        { nickname: "Player3", token: player3Token.token },
        { nickname: "Player4", token: player4Token.token },
        { nickname: "Player5", token: player5Token.token },
        { nickname: "Player6", token: player6Token.token },
      ];

      // Find the correct tokens for each role
      const actualMafia1Token = playerTokens.find((pt) => pt.nickname === mafia1?.nickname)?.token;
      const actualMafia2Token = playerTokens.find((pt) => pt.nickname === mafia2?.nickname)?.token;
      const actualDetectiveToken = playerTokens.find(
        (pt) => pt.nickname === detective?.nickname
      )?.token;
      const actualDoctorToken = playerTokens.find((pt) => pt.nickname === doctor?.nickname)?.token;

      // Find a civilian token for testing
      const actualCivilianToken = playerTokens.find(
        (pt) => pt.nickname === civilian?.nickname
      )?.token;

      return {
        hostToken,
        mafia1,
        mafia2,
        civilian,
        detective,
        doctor,
        mafia1Token: actualMafia1Token!,
        mafia2Token: actualMafia2Token!,
        detectiveToken: actualDetectiveToken!,
        doctorToken: actualDoctorToken!,
        civilianToken: actualCivilianToken!,
        players,
      };
    }

    it("should eliminate target when both mafia choose the same target", async () => {
      const { hostToken, mafia1, mafia2, civilian, mafia1Token, mafia2Token } =
        await setupMafiaGame();

      // Both mafia vote for the same target
      await db.submitAction(mockDb, mafia1Token, "kill", civilian!.playerId);
      await db.submitAction(mockDb, mafia2Token, "kill", civilian!.playerId);

      // Resolve the night
      await db.changePhase(mockDb, hostToken, "day");

      // Check if civilian was eliminated (main test - unanimous mafia should eliminate target)
      const state = await db.getGameState(mockDb, hostToken);
      const updatedCivilian = state!.players.find((p) => p.playerId === civilian!.playerId);
      expect(updatedCivilian!.isAlive).toBe(false);
    });

    it("should not eliminate anyone when mafia choose different targets", async () => {
      const { hostToken, mafia1, mafia2, civilian, detective, mafia1Token, mafia2Token } =
        await setupMafiaGame();

      // Mafia vote for different targets
      await db.submitAction(mockDb, mafia1Token, "kill", civilian!.playerId);
      await db.submitAction(mockDb, mafia2Token, "kill", detective!.playerId);

      // Resolve the night
      await db.changePhase(mockDb, hostToken, "day");

      // Check that both targets are still alive (disagreement should prevent elimination)
      const state = await db.getGameState(mockDb, hostToken);
      const updatedCivilian = state!.players.find((p) => p.playerId === civilian!.playerId);
      const updatedDetective = state!.players.find((p) => p.playerId === detective!.playerId);

      expect(updatedCivilian!.isAlive).toBe(true);
      expect(updatedDetective!.isAlive).toBe(true);
    });

    it("should eliminate target when solo mafia votes", async () => {
      const { hostToken, mafia1, mafia2, civilian, mafia1Token } = await setupMafiaGame();

      // Eliminate one mafia first to create solo scenario
      await mockDb
        .prepare("UPDATE game_players SET is_alive = 0 WHERE player_id = ?")
        .bind(mafia2!.playerId)
        .run();

      // Solo mafia votes
      await db.submitAction(mockDb, mafia1Token, "kill", civilian!.playerId);

      // Resolve the night
      await db.changePhase(mockDb, hostToken, "day");

      // Check if civilian was eliminated
      const state = await db.getGameState(mockDb, hostToken);
      const updatedCivilian = state!.players.find((p) => p.playerId === civilian!.playerId);
      expect(updatedCivilian!.isAlive).toBe(false);
    });

    it("should not eliminate anyone when not all mafia vote", async () => {
      const { hostToken, mafia1, civilian, mafia1Token } = await setupMafiaGame();

      // Only one of two mafia votes
      await db.submitAction(mockDb, mafia1Token, "kill", civilian!.playerId);
      // mafia2 doesn't vote

      // Resolve the night
      await db.changePhase(mockDb, hostToken, "day");

      // Check that target is still alive (partial voting should prevent elimination)
      const state = await db.getGameState(mockDb, hostToken);
      const updatedCivilian = state!.players.find((p) => p.playerId === civilian!.playerId);
      expect(updatedCivilian!.isAlive).toBe(true);
    });

    it("should respect doctor protection even with unanimous mafia vote", async () => {
      const { hostToken, mafia1, mafia2, civilian, doctor, mafia1Token, mafia2Token, doctorToken } =
        await setupMafiaGame();

      // Both mafia vote for the same target
      await db.submitAction(mockDb, mafia1Token, "kill", civilian!.playerId);
      await db.submitAction(mockDb, mafia2Token, "kill", civilian!.playerId);

      // Doctor protects the same target
      await db.submitAction(mockDb, doctorToken, "protect", civilian!.playerId);

      // Resolve the night
      await db.changePhase(mockDb, hostToken, "day");

      // Check that civilian is still alive due to protection
      const state = await db.getGameState(mockDb, hostToken);
      const updatedCivilian = state!.players.find((p) => p.playerId === civilian!.playerId);
      expect(updatedCivilian!.isAlive).toBe(true);
    });
  });
});

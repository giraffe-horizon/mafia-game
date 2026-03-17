import { describe, it, expect } from "vitest";
import * as store from "@/lib/store";

describe("In-memory Store", () => {
  describe("Basic functionality", () => {
    it("should export createGame function", () => {
      expect(typeof store.createGame).toBe("function");
    });

    it("should export joinGame function", () => {
      expect(typeof store.joinGame).toBe("function");
    });

    it("should export getGameState function", () => {
      expect(typeof store.getGameState).toBe("function");
    });

    it("should export startGame function", () => {
      expect(typeof store.startGame).toBe("function");
    });

    it("should handle createGame call", () => {
      const result = store.createGame("TestHost");

      expect(result).toBeDefined();
      expect(result.game).toBeDefined();
      expect(result.hostPlayer).toBeDefined();
      expect(result.hostPlayer.nickname).toBe("TestHost");
    });

    it("should handle getGameState with invalid token", () => {
      const result = store.getGameState("invalid-token");
      expect(result).toBeNull();
    });

    it("should handle joinGame with invalid code", () => {
      const result = store.joinGame("INVALID", "Player");

      // joinGame returns null when game not found
      expect(result).toBeNull();
    });

    it("should handle startGame with invalid token", () => {
      const result = store.startGame("invalid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Type validation", () => {
    it("should handle game creation flow", () => {
      const createResult = store.createGame("Host");

      expect(createResult.game.status).toBe("lobby");
      expect(createResult.game.phase).toBe("lobby");
      expect(createResult.hostPlayer.isHost).toBe(true);
    });

    it("should validate game codes", () => {
      const result1 = store.createGame("Host1");
      const result2 = store.createGame("Host2");

      // Should generate different codes
      expect(result1.game.code).not.toBe(result2.game.code);

      // Code format: "MAFIA-" + 4 chars = 10 characters
      expect(result1.game.code).toMatch(/^MAFIA-[A-Z0-9]{4}$/);
      expect(result2.game.code).toMatch(/^MAFIA-[A-Z0-9]{4}$/);
    });

    it("should handle game state retrieval", () => {
      const createResult = store.createGame("TestHost");
      const gameState = store.getGameState(createResult.hostPlayer.token);

      expect(gameState).not.toBeNull();
      if (gameState) {
        expect(gameState.currentPlayer.nickname).toBe("TestHost");
        expect(gameState.currentPlayer.isHost).toBe(true);
        expect(gameState.game.status).toBe("lobby");
      }
    });

    it("should handle valid join requests", () => {
      const host = store.createGame("Host");
      const joinResult = store.joinGame(host.game.code, "Player1");

      expect(joinResult).not.toBeNull();
      if (joinResult) {
        const playerState = store.getGameState(joinResult.player.token);
        expect(playerState?.currentPlayer.nickname).toBe("Player1");
        expect(playerState?.currentPlayer.isHost).toBe(false);
      }
    });

    it("should handle minimum players validation", () => {
      const host = store.createGame("Host");
      const startResult = store.startGame(host.hostPlayer.token);

      expect(startResult.success).toBe(false);
      expect(startResult.error).toContain("minimum");
    });
  });
});

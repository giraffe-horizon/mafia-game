import { describe, it, expect, vi } from "vitest";
import { createMockD1Database } from "./helpers/mockD1";
import * as db from "@/db";

// Mock nanoid to have predictable IDs in tests
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-id-" + Math.random().toString(36).slice(2)),
}));

describe("Database functions", () => {
  describe("Basic functionality tests", () => {
    it("should handle createGame with valid input", async () => {
      const mockDb = createMockD1Database();
      const result = await db.createGame(mockDb, "TestHost");

      expect(result).toHaveProperty("token");
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(5);
    });

    it("should handle getGameState with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.getGameState(mockDb, "invalid-token");

      expect(result).toBeNull();
    });

    it("should handle joinGame with invalid code", async () => {
      const mockDb = createMockD1Database();
      const result = await db.joinGame(mockDb, "INVALID", "Player");

      // joinGame returns null when game not found
      expect(result).toBeNull();
    });

    it("should handle startGame with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.startGame(mockDb, "invalid");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle submitAction with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.submitAction(mockDb, "invalid", "vote", "target");

      expect(result.success).toBe(false);
    });

    it("should handle changePhase with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.changePhase(mockDb, "invalid", "day");

      expect(result.success).toBe(false);
    });

    it("should handle renamePlayer validation", async () => {
      const mockDb = createMockD1Database();

      // Test with invalid token
      const result = await db.renamePlayer(mockDb, "invalid", "NewName");
      expect(result.success).toBe(false);
    });

    it("should handle sendMessage with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.sendMessage(mockDb, "invalid", "message", "target");

      expect(result.success).toBe(false);
    });

    it("should handle kickPlayer with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.kickPlayer(mockDb, "invalid", "target");

      expect(result.success).toBe(false);
    });

    it("should handle createMission with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.createMission(mockDb, "invalid", "target", "desc", false, 1);

      expect(result.success).toBe(false);
    });

    it("should handle transferGm with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.transferGm(mockDb, "invalid", "newHost");

      expect(result.success).toBe(false);
    });

    it("should handle finalizeGame with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.finalizeGame(mockDb, "invalid");

      expect(result.success).toBe(false);
    });

    it("should handle deleteMission with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.deleteMission(mockDb, "invalid", "missionId");

      expect(result.success).toBe(false);
    });

    it("should handle completeMission with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.completeMission(mockDb, "invalid", "missionId");

      expect(result.success).toBe(false);
    });

    it("should handle rematch with invalid token", async () => {
      const mockDb = createMockD1Database();
      const result = await db.rematch(mockDb, "invalid");

      expect(result.success).toBe(false);
    });
  });

  describe("Type definitions", () => {
    it("should export proper types", () => {
      expect(typeof db.createGame).toBe("function");
      expect(typeof db.joinGame).toBe("function");
      expect(typeof db.getGameState).toBe("function");
      expect(typeof db.startGame).toBe("function");
    });
  });
});

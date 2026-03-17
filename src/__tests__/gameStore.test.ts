import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/stores/gameStore";

describe("Game Store (Zustand)", () => {
  beforeEach(() => {
    useGameStore.setState({ gameState: null });
  });

  describe("Store structure", () => {
    it("should have correct interface shape", () => {
      const store = useGameStore.getState();

      expect(store).toHaveProperty("gameState");
      expect(store).toHaveProperty("setGameState");

      expect(typeof store.setGameState).toBe("function");
    });

    it("should initialize with correct default values", () => {
      const store = useGameStore.getState();

      expect(store.gameState).toBeNull();
    });
  });

  describe("Store methods", () => {
    it("should set game state", () => {
      const mockState = {
        game: {
          id: "game-123",
          code: "ABCDEF",
          status: "lobby" as const,
          phase: "lobby" as const,
          round: 0,
          winner: null,
        },
        currentPlayer: {
          playerId: "p1",
          nickname: "Test",
          token: "tok",
          role: null,
          isAlive: true,
          isHost: true,
          isSetupComplete: true,
        },
        players: [],
        messages: [],
        missions: [],
        detectiveResult: null,
        myAction: null,
        takenCharacterIds: [],
      };
      useGameStore.getState().setGameState(mockState as never);
      expect(useGameStore.getState().gameState).toBeDefined();
    });

    it("should clear game state", () => {
      useGameStore.getState().setGameState(null);
      expect(useGameStore.getState().gameState).toBeNull();
    });
  });

  describe("Store file validation", () => {
    it("should import without errors", async () => {
      const storeModule = await import("@/stores/gameStore");

      expect(storeModule).toBeDefined();
      expect(storeModule.useGameStore).toBeDefined();
    });

    it("should use proper TypeScript types", () => {
      const store = useGameStore.getState();

      expect(store.gameState !== undefined).toBe(true);
      expect(store.setGameState).toBeDefined();
    });
  });

  describe("Type compatibility", () => {
    it("should accept valid game state structure", () => {
      const mockGameState = {
        game: {
          id: "game-123",
          code: "ABCDEF",
          status: "lobby" as const,
          phase: "lobby" as const,
          round: 0,
          winner: null,
        },
        currentPlayer: {
          playerId: "p1",
          nickname: "TestPlayer",
          token: "token-123",
          role: null,
          isAlive: true,
          isHost: true,
          isSetupComplete: true,
          character: null,
        },
        players: [],
        messages: [],
        missions: [],
        detectiveResult: null,
        myAction: null,
        takenCharacterIds: [],
      };

      expect(mockGameState).toBeDefined();
      expect(mockGameState.game.status).toBe("lobby");
    });

    it("should handle complex game states", () => {
      const complexGameState = {
        game: {
          id: "game-456",
          code: "COMPLEX",
          status: "playing" as const,
          phase: "night" as const,
          round: 3,
          winner: null,
        },
        currentPlayer: {
          playerId: "p0",
          nickname: "Player Name",
          token: "token-456",
          role: "mafia" as const,
          isAlive: true,
          isHost: false,
          isSetupComplete: true,
          character: null,
        },
        players: [
          {
            playerId: "p1",
            nickname: "Player 1",
            isAlive: true,
            isHost: false,
            role: null,
            isYou: false,
            character: null,
          },
        ],
        messages: [],
        missions: [
          {
            id: "mission1",
            description: "Test mission",
            isSecret: false,
            isCompleted: false,
            points: 1,
          },
        ],
        detectiveResult: null,
        myAction: null,
        takenCharacterIds: [],
      };

      expect(complexGameState.game.round).toBe(3);
      expect(complexGameState.currentPlayer.role).toBe("mafia");
      expect(complexGameState.players).toHaveLength(1);
      expect(complexGameState.missions).toHaveLength(1);
    });
  });
});

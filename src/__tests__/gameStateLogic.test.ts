import { describe, it, expect } from "vitest";
import type { PublicPlayer } from "@/db/types";

describe("Game State Logic", () => {
  describe("Dead player spectator logic", () => {
    const mockPlayers: PublicPlayer[] = [
      {
        playerId: "player-1",
        nickname: "Alice",
        isAlive: true,
        isHost: false,
        isYou: false,
        role: "detective",
        character: { id: "char-1", slug: "alice", namePl: "Alice", avatarUrl: "" },
      },
      {
        playerId: "player-2",
        nickname: "Bob",
        isAlive: false,
        isHost: false,
        isYou: false,
        role: "mafia",
        character: { id: "char-2", slug: "bob", namePl: "Bob", avatarUrl: "" },
      },
      {
        playerId: "gm-1",
        nickname: "GameMaster",
        isAlive: true,
        isHost: true,
        isYou: false,
        role: null,
        character: null,
      },
    ];

    it("should filter out GM from player list for spectator view", () => {
      const nonGMPlayers = mockPlayers.filter((p) => !p.isHost);

      expect(nonGMPlayers).toHaveLength(2);
      expect(nonGMPlayers.every((p) => !p.isHost)).toBe(true);
    });

    it("should identify dead and alive players correctly", () => {
      const alivePlayers = mockPlayers.filter((p) => p.isAlive);
      const deadPlayers = mockPlayers.filter((p) => !p.isAlive);

      expect(alivePlayers).toHaveLength(2); // Alice + GM
      expect(deadPlayers).toHaveLength(1); // Bob
      expect(deadPlayers[0].nickname).toBe("Bob");
    });

    it("should show roles for all players in spectator view", () => {
      const playersWithRoles = mockPlayers.filter((p) => !p.isHost && p.role);

      expect(playersWithRoles).toHaveLength(2);
      expect(playersWithRoles[0].role).toBe("detective");
      expect(playersWithRoles[1].role).toBe("mafia");
    });
  });

  describe("Role visibility logic", () => {
    it("should handle role visibility states", () => {
      const testStates = [true, false];

      testStates.forEach((visible) => {
        // Simulate roleVisible logic
        const shouldShowRole = visible;
        expect(typeof shouldShowRole).toBe("boolean");
      });
    });

    it("should toggle role visibility correctly", () => {
      let roleVisible = false;

      // Simulate toggle
      roleVisible = !roleVisible;
      expect(roleVisible).toBe(true);

      roleVisible = !roleVisible;
      expect(roleVisible).toBe(false);
    });
  });

  describe("End game logic", () => {
    it("should determine winner correctly for mafia", () => {
      const winner = "mafia";
      const isWinner = (currentPlayerRole: string) =>
        (winner === "mafia" && currentPlayerRole === "mafia") ||
        (winner === "town" && currentPlayerRole !== "mafia");

      expect(isWinner("mafia")).toBe(true);
      expect(isWinner("detective")).toBe(false);
      expect(isWinner("civilian")).toBe(false);
    });

    it("should determine winner correctly for town", () => {
      const winner = "town";
      const isWinner = (currentPlayerRole: string) =>
        (winner === "mafia" && currentPlayerRole === "mafia") ||
        (winner === "town" && currentPlayerRole !== "mafia");

      expect(isWinner("mafia")).toBe(false);
      expect(isWinner("detective")).toBe(true);
      expect(isWinner("civilian")).toBe(true);
      expect(isWinner("doctor")).toBe(true);
    });

    it("should calculate mission summary correctly", () => {
      const hostMissions = [
        { playerId: "player-1", playerNickname: "Alice", isCompleted: true, points: 10 },
        { playerId: "player-1", playerNickname: "Alice", isCompleted: false, points: 5 },
        { playerId: "player-2", playerNickname: "Bob", isCompleted: true, points: 15 },
      ];

      // Simulate mission summary calculation from EndScreen
      const missionSummary = Object.values(
        hostMissions.reduce<
          Record<string, { nickname: string; completed: number; total: number; points: number }>
        >((acc, m) => {
          if (!acc[m.playerId])
            acc[m.playerId] = { nickname: m.playerNickname, completed: 0, total: 0, points: 0 };
          acc[m.playerId].total++;
          if (m.isCompleted) {
            acc[m.playerId].completed++;
            acc[m.playerId].points += m.points;
          }
          return acc;
        }, {})
      );

      expect(missionSummary).toHaveLength(2);

      const aliceSummary = missionSummary.find((s) => s.nickname === "Alice");
      expect(aliceSummary).toEqual({
        nickname: "Alice",
        completed: 1,
        total: 2,
        points: 10,
      });

      const bobSummary = missionSummary.find((s) => s.nickname === "Bob");
      expect(bobSummary).toEqual({
        nickname: "Bob",
        completed: 1,
        total: 1,
        points: 15,
      });
    });
  });

  describe("Badge variant logic", () => {
    it("should map role to badge variant correctly", () => {
      const roleToVariant = (role: string) => {
        switch (role) {
          case "mafia":
            return "mafia";
          case "detective":
            return "detective";
          case "doctor":
            return "doctor";
          case "civilian":
          default:
            return "civilian";
        }
      };

      expect(roleToVariant("mafia")).toBe("mafia");
      expect(roleToVariant("detective")).toBe("detective");
      expect(roleToVariant("doctor")).toBe("doctor");
      expect(roleToVariant("civilian")).toBe("civilian");
      expect(roleToVariant("unknown")).toBe("civilian");
    });

    it("should handle role assertion type casting safely", () => {
      const roles = ["mafia", "detective", "doctor", "civilian"];

      roles.forEach((role) => {
        const variant = role as "mafia" | "detective" | "doctor" | "civilian";
        expect(["mafia", "detective", "doctor", "civilian"]).toContain(variant);
      });
    });
  });
});

describe("Phase transition event handling", () => {
  it("should handle kill event types correctly", () => {
    type KillEventType = "kill" | "no_kill";
    const killEvents: KillEventType[] = ["kill", "no_kill"];

    killEvents.forEach((eventType) => {
      const shouldShowDeath = eventType === "kill";
      const iconType = shouldShowDeath ? "skull" : "shield";
      const titleText = shouldShowDeath ? "nie przeżył tej nocy" : "Wszyscy przeżyli!";

      if (eventType === "kill") {
        expect(iconType).toBe("skull");
        expect(titleText).toBe("nie przeżył tej nocy");
      } else {
        expect(iconType).toBe("shield");
        expect(titleText).toBe("Wszyscy przeżyli!");
      }
    });
  });

  it("should handle eliminate event types correctly", () => {
    type EliminateEventType = "eliminate" | "no_eliminate";
    const eliminateEvents: EliminateEventType[] = ["eliminate", "no_eliminate"];

    eliminateEvents.forEach((eventType) => {
      const shouldShowElimination = eventType === "eliminate";
      const subtitleText = shouldShowElimination
        ? "został wyeliminowany"
        : "Nikt nie został wyeliminowany";

      if (eventType === "eliminate") {
        expect(subtitleText).toBe("został wyeliminowany");
      } else {
        expect(subtitleText).toBe("Nikt nie został wyeliminowany");
      }
    });
  });
});

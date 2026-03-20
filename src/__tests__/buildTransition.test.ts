import { describe, it, expect } from "vitest";
import { buildTransition } from "@/features/game/store/buildTransition";

describe("buildTransition", () => {
  describe("game start transitions", () => {
    it("should create lobby to night transition on game start", () => {
      const result = buildTransition("lobby", "night", 1);

      expect(result).toBeDefined();
      expect(result!.type).toBe("game_start");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[0]).toEqual({
        icon: "casino",
        title: "Gra rozpoczęta!",
        subtitle: "Role zostały przydzielone",
        durationMs: 2500,
      });

      expect(result!.screens[1]).toEqual({
        icon: "bedtime",
        title: "Zapada noc...",
        subtitle: "Runda 1",
        durationMs: 2000,
      });
    });
  });

  describe("night to day transitions", () => {
    it("should create night to day transition with kill event", () => {
      const result = buildTransition("night", "day", 2, {
        type: "kill",
        playerId: "player-1",
        nickname: "TestPlayer",
        role: "civilian",
      });

      expect(result).toBeDefined();
      expect(result!.type).toBe("night_to_day");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[0]).toEqual({
        icon: "wb_sunny",
        title: "Nadchodzi świt...",
        subtitle: "Miasto się budzi",
        durationMs: 2000,
      });

      expect(result!.screens[1]).toEqual({
        icon: "skull",
        title: "TestPlayer",
        subtitle: "nie przeżył tej nocy",
        durationMs: 3000,
      });
    });

    it("should create night to day transition with no kill event", () => {
      const result = buildTransition("night", "day", 2, {
        type: "no_kill",
      });

      expect(result).toBeDefined();
      expect(result!.type).toBe("night_to_day");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[1]).toEqual({
        icon: "shield",
        title: "Wszyscy przeżyli!",
        subtitle: "Tej nocy nikt nie zginął",
        durationMs: 2500,
      });
    });

    it("should handle night to day transition without lastPhaseResult", () => {
      const result = buildTransition("night", "day", 3);

      expect(result).toBeDefined();
      expect(result!.type).toBe("night_to_day");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[1]).toEqual({
        icon: "shield",
        title: "Wszyscy przeżyli!",
        subtitle: "Tej nocy nikt nie zginął",
        durationMs: 2500,
      });
    });
  });

  describe("day to voting transitions", () => {
    it("should create day to voting transition", () => {
      const result = buildTransition("day", "voting", 2);

      expect(result).toBeDefined();
      expect(result!.type).toBe("day_to_voting");
      expect(result!.screens).toHaveLength(1);

      expect(result!.screens[0]).toEqual({
        icon: "how_to_vote",
        title: "Głosowanie",
        subtitle: "Czas na oskarżenia",
        durationMs: 2000,
      });
    });
  });

  describe("voting to night transitions", () => {
    it("should create voting to night transition with elimination", () => {
      const result = buildTransition("voting", "night", 3, {
        type: "eliminate",
        playerId: "player-2",
        nickname: "EliminatedPlayer",
        role: "mafia",
      });

      expect(result).toBeDefined();
      expect(result!.type).toBe("voting_to_night");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[0]).toEqual({
        icon: "gavel",
        title: "Wyrok zapadł...",
        subtitle: "EliminatedPlayer został wyeliminowany",
        durationMs: 2500,
      });

      expect(result!.screens[1]).toEqual({
        icon: "bedtime",
        title: "Zapada noc...",
        subtitle: "Runda 3",
        durationMs: 2000,
      });
    });

    it("should create voting to night transition with no elimination", () => {
      const result = buildTransition("voting", "night", 2, {
        type: "no_eliminate",
      });

      expect(result).toBeDefined();
      expect(result!.type).toBe("voting_to_night");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[0]).toEqual({
        icon: "gavel",
        title: "Wyrok zapadł...",
        subtitle: "Nikt nie został wyeliminowany",
        durationMs: 2500,
      });
    });
  });

  describe("game ending transitions", () => {
    it("should create voting to ended transition with mafia win", () => {
      const result = buildTransition(
        "voting",
        "ended",
        2,
        {
          type: "eliminate",
          playerId: "player-1",
          nickname: "LastTown",
          role: "civilian",
        },
        "mafia"
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe("game_ended");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[0]).toEqual({
        icon: "gavel",
        title: "Wyrok zapadł...",
        subtitle: "LastTown został wyeliminowany",
        durationMs: 2500,
      });

      expect(result!.screens[1]).toEqual({
        icon: "emoji_events",
        title: "Mafia wygrywa!",
        subtitle: "Przestępcy przejęli kontrolę",
        durationMs: 3000,
      });
    });

    it("should create night to ended transition with town win", () => {
      const result = buildTransition(
        "night",
        "ended",
        3,
        {
          type: "kill",
          playerId: "last-mafia",
          nickname: "LastMafia",
          role: "mafia",
        },
        "town"
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe("game_ended");
      expect(result!.screens).toHaveLength(2);

      expect(result!.screens[0]).toEqual({
        icon: "skull",
        title: "LastMafia",
        subtitle: "nie przeżył tej nocy",
        durationMs: 2500,
      });

      expect(result!.screens[1]).toEqual({
        icon: "emoji_events",
        title: "Miasto wygrywa!",
        subtitle: "Sprawiedliwość zwyciężyła",
        durationMs: 3000,
      });
    });

    it("should create review to ended transition", () => {
      const result = buildTransition("review", "ended", 2, undefined, "town");

      expect(result).toBeDefined();
      expect(result!.type).toBe("game_ended");
      expect(result!.screens).toHaveLength(1);

      expect(result!.screens[0]).toEqual({
        icon: "emoji_events",
        title: "Miasto wygrywa!",
        subtitle: "Sprawiedliwość zwyciężyła",
        durationMs: 3000,
      });
    });

    it("should create voting to review transition with elimination", () => {
      const result = buildTransition(
        "voting",
        "review",
        2,
        {
          type: "eliminate",
          playerId: "player-1",
          nickname: "EliminatedPlayer",
          role: "civilian",
        },
        "mafia"
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe("game_ended");
      expect(result!.screens).toHaveLength(2);
    });
  });

  describe("edge cases and invalid transitions", () => {
    it("should return null for invalid phase transitions", () => {
      const result = buildTransition("day", "night", 1);
      expect(result).toBeNull();
    });

    it("should return null for same phase transition", () => {
      const result = buildTransition("lobby", "lobby", 1);
      expect(result).toBeNull();
    });

    it("should return null for unsupported phase combinations", () => {
      const result = buildTransition("ended", "lobby", 1);
      expect(result).toBeNull();
    });
  });

  describe("round number handling", () => {
    it("should correctly display round numbers in transitions", () => {
      const round5 = buildTransition("lobby", "night", 5);
      expect(round5!.screens[1].subtitle).toBe("Runda 5");

      const round10 = buildTransition("voting", "night", 10, { type: "no_eliminate" });
      expect(round10!.screens[1].subtitle).toBe("Runda 10");
    });
  });

  describe("event type variations", () => {
    it("should handle all kill event types", () => {
      const killTypes = ["kill", "no_kill"] as const;

      killTypes.forEach((type) => {
        const result = buildTransition("night", "day", 1, { type });
        expect(result).toBeDefined();
        expect(result!.type).toBe("night_to_day");
      });
    });

    it("should handle all eliminate event types", () => {
      const eliminateTypes = ["eliminate", "no_eliminate"] as const;

      eliminateTypes.forEach((type) => {
        const result = buildTransition("voting", "night", 1, { type });
        expect(result).toBeDefined();
        expect(result!.type).toBe("voting_to_night");
      });
    });
  });
});

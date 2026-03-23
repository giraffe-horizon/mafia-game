import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { GameStateResponse } from "@/db";

// ---------------------------------------------------------------------------
// Test suite for processStateUpdate — the core state-comparison logic shared
// by both polling and WebSocket state updates.
// ---------------------------------------------------------------------------

let useGameStore: typeof import("@/features/game/store/gameStore").useGameStore;

/** Minimal valid GameStateResponse for testing */
function makeState(overrides: Partial<GameStateResponse> = {}): GameStateResponse {
  return {
    game: {
      id: "test-game-id",
      code: "ABC123",
      status: "playing",
      phase: "night",
      round: 1,
      winner: null,
      phaseDeadline: null,
      config: {},
    },
    currentPlayer: {
      playerId: "p1",
      nickname: "TestPlayer",
      token: "tok1",
      role: "cywil",
      isAlive: true,
      isHost: false,
      isSetupComplete: true,
      character: null,
    },
    takenCharacterIds: [],
    players: [],
    messages: [],
    missions: [],
    investigatedPlayers: [],
    detectiveResult: null,
    myAction: null,
    showPoints: false,
    ...overrides,
  };
}

describe("processStateUpdate", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const mod = await import("@/features/game/store/gameStore");
    useGameStore = mod.useGameStore;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets state on first call", () => {
    const data = makeState();
    useGameStore.getState().handleWsStateUpdate(data);

    expect(useGameStore.getState().state).toBe(data);
  });

  it("detects phase change and sets transition", () => {
    // Set initial state
    useGameStore
      .getState()
      .handleWsStateUpdate(
        makeState({
          game: {
            id: "g",
            code: "C",
            status: "playing",
            phase: "night",
            round: 1,
            winner: null,
            phaseDeadline: null,
            config: {},
          },
        })
      );

    // Transition night → day
    const dayState = makeState({
      game: {
        id: "g",
        code: "C",
        status: "playing",
        phase: "day",
        round: 1,
        winner: null,
        phaseDeadline: null,
        config: {},
      },
      lastPhaseResult: { type: "no_kill" },
    });
    useGameStore.getState().handleWsStateUpdate(dayState);

    const { transition } = useGameStore.getState();
    expect(transition).not.toBeNull();
    expect(transition?.type).toBe("night_to_day");
  });

  it("auto-switches active tab on phase change to day", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    const dayState = makeState({
      game: {
        id: "g",
        code: "C",
        status: "playing",
        phase: "day",
        round: 1,
        winner: null,
        phaseDeadline: null,
        config: {},
      },
    });
    useGameStore.getState().handleWsStateUpdate(dayState);

    expect(useGameStore.getState().activeTab).toBe("day");
  });

  it("auto-switches active tab to night for non-host on night phase", () => {
    // Start at day
    useGameStore
      .getState()
      .handleWsStateUpdate(
        makeState({
          game: {
            id: "g",
            code: "C",
            status: "playing",
            phase: "day",
            round: 1,
            winner: null,
            phaseDeadline: null,
            config: {},
          },
        })
      );

    // Voting
    useGameStore
      .getState()
      .handleWsStateUpdate(
        makeState({
          game: {
            id: "g",
            code: "C",
            status: "playing",
            phase: "voting",
            round: 1,
            winner: null,
            phaseDeadline: null,
            config: {},
          },
        })
      );

    // Night round 2
    useGameStore
      .getState()
      .handleWsStateUpdate(
        makeState({
          game: {
            id: "g",
            code: "C",
            status: "playing",
            phase: "night",
            round: 2,
            winner: null,
            phaseDeadline: null,
            config: {},
          },
        })
      );

    expect(useGameStore.getState().activeTab).toBe("night");
  });

  it("clears shown IDs on phase change (uses set, not mutation)", () => {
    useGameStore.getState().handleWsStateUpdate(
      makeState({
        messages: [{ id: "m1", content: "Hello", createdAt: new Date().toISOString() }],
      })
    );

    // Grab reference to the Set
    const oldMessageIds = useGameStore.getState()._shownMessageIds;
    expect(oldMessageIds.has("m1")).toBe(true);

    // Phase change should replace with new Set (not mutate)
    useGameStore.getState().handleWsStateUpdate(
      makeState({
        game: {
          id: "g",
          code: "C",
          status: "playing",
          phase: "day",
          round: 1,
          winner: null,
          phaseDeadline: null,
          config: {},
        },
        messages: [],
      })
    );

    // Old reference should still have m1 (it was not mutated)
    expect(oldMessageIds.has("m1")).toBe(true);
    // New set should be empty
    expect(useGameStore.getState()._shownMessageIds.size).toBe(0);
    // Should be a different Set instance
    expect(useGameStore.getState()._shownMessageIds).not.toBe(oldMessageIds);
  });

  it("creates toast for new messages (no phase change)", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    useGameStore.getState().handleWsStateUpdate(
      makeState({
        messages: [{ id: "msg1", content: "Test message", createdAt: new Date().toISOString() }],
      })
    );

    const toasts = useGameStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].content).toBe("Test message");
  });

  it("does not create duplicate toasts for same message", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    const messages = [{ id: "msg1", content: "Test", createdAt: new Date().toISOString() }];
    useGameStore.getState().handleWsStateUpdate(makeState({ messages }));
    useGameStore.getState().handleWsStateUpdate(makeState({ messages }));

    expect(useGameStore.getState().toasts).toHaveLength(1);
  });

  it("suppresses toasts during phase transitions", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    // Phase change with new message — toast should be suppressed
    useGameStore.getState().handleWsStateUpdate(
      makeState({
        game: {
          id: "g",
          code: "C",
          status: "playing",
          phase: "day",
          round: 1,
          winner: null,
          phaseDeadline: null,
          config: {},
        },
        messages: [{ id: "msg1", content: "Phase message", createdAt: new Date().toISOString() }],
      })
    );

    expect(useGameStore.getState().toasts).toHaveLength(0);
    // But message should be marked as shown (won't toast later)
    expect(useGameStore.getState()._shownMessageIds.has("msg1")).toBe(true);
  });

  it("creates mission toast and increments tab notification", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    useGameStore.getState().handleWsStateUpdate(
      makeState({
        missions: [
          {
            id: "msn1",
            description: "Do something",
            isSecret: false,
            isCompleted: false,
            points: 1,
          },
        ],
      })
    );

    const toasts = useGameStore.getState().toasts;
    expect(toasts.some((t) => t.id === "mission-msn1")).toBe(true);
    expect(useGameStore.getState().tabNotifications["agents"]).toBeGreaterThan(0);
  });

  it("syncs timer from phaseDeadline on non-phase-change update", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    const deadline = new Date(Date.now() + 30000).toISOString();
    useGameStore.getState().handleWsStateUpdate(
      makeState({
        game: {
          id: "g",
          code: "C",
          status: "playing",
          phase: "night",
          round: 1,
          winner: null,
          phaseDeadline: deadline,
          config: {},
        },
      })
    );

    expect(useGameStore.getState().phaseDeadline).toBe(deadline);
    expect(useGameStore.getState().serverRemainingMs).toBeGreaterThan(0);
  });

  it("clears timer on phase change", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());

    const deadline = new Date(Date.now() + 30000).toISOString();
    useGameStore.getState().handleWsStateUpdate(
      makeState({
        game: {
          id: "g",
          code: "C",
          status: "playing",
          phase: "night",
          round: 1,
          winner: null,
          phaseDeadline: deadline,
          config: {},
        },
      })
    );
    expect(useGameStore.getState().phaseDeadline).toBe(deadline);

    // Phase change clears timer
    useGameStore.getState().handleWsStateUpdate(
      makeState({
        game: {
          id: "g",
          code: "C",
          status: "playing",
          phase: "day",
          round: 1,
          winner: null,
          phaseDeadline: null,
          config: {},
        },
      })
    );
    expect(useGameStore.getState().phaseDeadline).toBeNull();
  });

  it("resets roleVisible on round change", () => {
    useGameStore.getState().handleWsStateUpdate(makeState());
    useGameStore.setState({ roleVisible: true });

    useGameStore.getState().handleWsStateUpdate(
      makeState({
        game: {
          id: "g",
          code: "C",
          status: "playing",
          phase: "night",
          round: 2,
          winner: null,
          phaseDeadline: null,
          config: {},
        },
      })
    );

    expect(useGameStore.getState().roleVisible).toBe(false);
  });
});

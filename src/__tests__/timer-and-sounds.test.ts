import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// 1. timerSlice
// ---------------------------------------------------------------------------
describe("timerSlice", () => {
  // Isolate store between tests
  let useGameStore: typeof import("@/features/game/store/gameStore").useGameStore;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("@/features/game/store/gameStore");
    useGameStore = mod.useGameStore;
  });

  it("starts with null deadline", () => {
    const { phaseDeadline, serverRemainingMs } = useGameStore.getState();
    expect(phaseDeadline).toBeNull();
    expect(serverRemainingMs).toBeNull();
  });

  it("setPhaseDeadline updates deadline and remainingMs", () => {
    const deadline = new Date(Date.now() + 60000).toISOString();
    useGameStore.getState().setPhaseDeadline(deadline, 60000);

    const state = useGameStore.getState();
    expect(state.phaseDeadline).toBe(deadline);
    expect(state.serverRemainingMs).toBe(60000);
  });

  it("clearPhaseDeadline resets to null", () => {
    const deadline = new Date(Date.now() + 60000).toISOString();
    useGameStore.getState().setPhaseDeadline(deadline, 60000);
    useGameStore.getState().clearPhaseDeadline();

    const state = useGameStore.getState();
    expect(state.phaseDeadline).toBeNull();
    expect(state.serverRemainingMs).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. soundSlice
// ---------------------------------------------------------------------------
describe("soundSlice", () => {
  let useGameStore: typeof import("@/features/game/store/gameStore").useGameStore;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    const mod = await import("@/features/game/store/gameStore");
    useGameStore = mod.useGameStore;
  });

  it("starts with sound enabled and default volume", () => {
    const { soundEnabled, soundVolume } = useGameStore.getState();
    expect(soundEnabled).toBe(true);
    expect(soundVolume).toBe(0.5);
  });

  it("toggleSound flips enabled and persists to localStorage", () => {
    useGameStore.getState().toggleSound();
    expect(useGameStore.getState().soundEnabled).toBe(false);
    expect(localStorage.getItem("mafia-sound-enabled")).toBe("false");

    useGameStore.getState().toggleSound();
    expect(useGameStore.getState().soundEnabled).toBe(true);
    expect(localStorage.getItem("mafia-sound-enabled")).toBe("true");
  });

  it("setVolume clamps and persists", () => {
    useGameStore.getState().setVolume(0.8);
    expect(useGameStore.getState().soundVolume).toBe(0.8);
    expect(localStorage.getItem("mafia-sound-volume")).toBe("0.8");

    // Clamp above 1
    useGameStore.getState().setVolume(2);
    expect(useGameStore.getState().soundVolume).toBe(1);

    // Clamp below 0
    useGameStore.getState().setVolume(-1);
    expect(useGameStore.getState().soundVolume).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. sounds.ts — functions don't throw
// ---------------------------------------------------------------------------
describe("sounds.ts", () => {
  // Mock AudioContext for happy-dom environment
  const mockOsc = {
    type: "sine" as OscillatorType,
    frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const mockGain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const mockCtx = {
    state: "running",
    currentTime: 0,
    destination: {},
    createOscillator: () => mockOsc,
    createGain: () => mockGain,
    resume: () => Promise.resolve(),
  };

  beforeEach(() => {
    vi.resetModules();
    // @ts-expect-error mock
    globalThis.AudioContext = vi.fn(() => mockCtx);
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete globalThis.AudioContext;
  });

  it("all sound functions execute without throwing", async () => {
    const s = await import("@/lib/sounds");
    expect(() => s.initAudio()).not.toThrow();
    expect(() => s.phaseChange(0.5)).not.toThrow();
    expect(() => s.voteReveal(0.5)).not.toThrow();
    expect(() => s.elimination(0.5)).not.toThrow();
    expect(() => s.missionReceived(0.5)).not.toThrow();
    expect(() => s.timerWarning(0.5)).not.toThrow();
    expect(() => s.timerExpired(0.5)).not.toThrow();
    expect(() => s.gameEnd(0.5)).not.toThrow();
    expect(() => s.nightFall(0.5)).not.toThrow();
  });

  it("sound functions handle missing AudioContext gracefully", async () => {
    // @ts-expect-error cleanup
    delete globalThis.AudioContext;
    vi.resetModules();
    const s = await import("@/lib/sounds");
    // Should not throw even without AudioContext
    expect(() => s.phaseChange(0.5)).not.toThrow();
    expect(() => s.timerExpired(0.5)).not.toThrow();
    expect(() => s.nightFall(0.5)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 4. usePhaseTimer hook
// ---------------------------------------------------------------------------
describe("usePhaseTimer", () => {
  let useGameStore: typeof import("@/features/game/store/gameStore").useGameStore;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const mod = await import("@/features/game/store/gameStore");
    useGameStore = mod.useGameStore;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns inactive when no deadline set", async () => {
    const { renderHook } = await import("@testing-library/react");
    const { usePhaseTimer } = await import("@/features/game/hooks/usePhaseTimer");

    const { result } = renderHook(() => usePhaseTimer());
    expect(result.current.isActive).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.remainingMs).toBe(0);
  });

  it("returns active and counts down when deadline is set", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { usePhaseTimer } = await import("@/features/game/hooks/usePhaseTimer");

    const deadline = new Date(Date.now() + 30000).toISOString();
    useGameStore.getState().setPhaseDeadline(deadline, 30000);

    const { result } = renderHook(() => usePhaseTimer());

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.remainingMs).toBeGreaterThan(0);
  });

  it("formats time correctly", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { usePhaseTimer } = await import("@/features/game/hooks/usePhaseTimer");

    const deadline = new Date(Date.now() + 65000).toISOString();
    useGameStore.getState().setPhaseDeadline(deadline, 65000);

    const { result } = renderHook(() => usePhaseTimer());
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Should be approximately 1:05 or 1:04
    expect(result.current.remainingFormatted).toMatch(/^1:0[4-5]$/);
  });
});

// ---------------------------------------------------------------------------
// 5. PhaseTimer component rendering
// ---------------------------------------------------------------------------
describe("PhaseTimer component", () => {
  let useGameStore: typeof import("@/features/game/store/gameStore").useGameStore;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();

    // Mock navigator.vibrate
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    const mod = await import("@/features/game/store/gameStore");
    useGameStore = mod.useGameStore;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when no deadline", async () => {
    const { render } = await import("@testing-library/react");
    const { default: PhaseTimer } = await import("@/features/game/components/shared/PhaseTimer");
    const { createElement } = await import("react");

    const { container } = render(createElement(PhaseTimer));
    expect(container.innerHTML).toBe("");
  });

  it("renders timer display when deadline is active", async () => {
    const { render, act } = await import("@testing-library/react");
    const { default: PhaseTimer } = await import("@/features/game/components/shared/PhaseTimer");
    const { createElement } = await import("react");

    const deadline = new Date(Date.now() + 60000).toISOString();
    useGameStore.getState().setPhaseDeadline(deadline, 60000);

    const { container } = render(createElement(PhaseTimer));

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Should contain the formatted time
    expect(container.textContent).toMatch(/\d:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// 6. Timer API route (unit-level validation)
// ---------------------------------------------------------------------------
describe("timer API schema", () => {
  it("validates timer schema correctly", async () => {
    const { z } = await import("zod");

    const setTimerSchema = z.object({
      durationSeconds: z.number().int().positive().max(600),
    });

    expect(() => setTimerSchema.parse({ durationSeconds: 60 })).not.toThrow();
    expect(() => setTimerSchema.parse({ durationSeconds: 0 })).toThrow();
    expect(() => setTimerSchema.parse({ durationSeconds: -1 })).toThrow();
    expect(() => setTimerSchema.parse({ durationSeconds: 601 })).toThrow();
    expect(() => setTimerSchema.parse({ durationSeconds: 1.5 })).toThrow();
    expect(() => setTimerSchema.parse({})).toThrow();
  });
});

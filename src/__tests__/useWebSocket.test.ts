import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWebSocket, type UseWebSocketParams } from "@/features/game/hooks/useWebSocket";

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

type WsHandler = ((event: { data: string }) => void) | null;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: WsHandler = null;
  onerror: (() => void) | null = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async open
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }

  // Test helpers
  simulateMessage(data: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.onclose?.();
  }

  simulateError() {
    this.onerror?.();
  }
}

// Patch global
const OriginalWebSocket = globalThis.WebSocket;

function getLastWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

const defaultParams: UseWebSocketParams = {
  gameId: "game-123",
  token: "token-abc",
  wsUrl: "wss://test.example.com",
  onStateUpdate: vi.fn(),
  onError: vi.fn(),
  enabled: true,
};

describe("useWebSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.WebSocket = MockWebSocket as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = OriginalWebSocket;
  });

  it("connects and authenticates on AUTH_REQUIRED", async () => {
    const onStateUpdate = vi.fn();
    renderHook(() => useWebSocket({ ...defaultParams, onStateUpdate }));

    // Trigger the async onopen
    await vi.advanceTimersByTimeAsync(1);

    const ws = getLastWs();
    expect(ws).toBeDefined();
    expect(ws.url).toBe("wss://test.example.com/ws/game?gameId=game-123");

    // Server sends AUTH_REQUIRED
    ws.simulateMessage({ type: "error", code: "AUTH_REQUIRED", message: "Send auth" });

    // Client should send auth
    expect(ws.sentMessages).toHaveLength(1);
    const authMsg = JSON.parse(ws.sentMessages[0]);
    expect(authMsg).toEqual({ type: "auth", token: "token-abc" });

    // Server responds with state
    const payload = { game: { id: "g1", phase: "lobby" } };
    ws.simulateMessage({ type: "state", payload, seq: 1 });

    expect(onStateUpdate).toHaveBeenCalledWith(payload);
  });

  it("reconnects on close with exponential backoff", async () => {
    renderHook(() => useWebSocket({ ...defaultParams }));
    await vi.advanceTimersByTimeAsync(1);

    expect(MockWebSocket.instances).toHaveLength(1);

    // Simulate close
    const ws = getLastWs();
    ws.simulateClose();

    // After 1s backoff, should reconnect
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);

    // Close again — backoff doubles to 2s
    getLastWs().simulateClose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2); // Not yet
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(3); // Now
  });

  it("calls onStateUpdate with payload and tracks seq", () => {
    const onStateUpdate = vi.fn();
    renderHook(() => useWebSocket({ ...defaultParams, onStateUpdate }));

    // Advance past async onopen
    vi.advanceTimersByTime(1);

    const ws = getLastWs();

    const payload1 = { game: { id: "g1", phase: "night" } };
    ws.simulateMessage({ type: "state", payload: payload1, seq: 1 });
    expect(onStateUpdate).toHaveBeenCalledTimes(1);
    expect(onStateUpdate).toHaveBeenCalledWith(payload1);

    const payload2 = { game: { id: "g1", phase: "day" } };
    ws.simulateMessage({ type: "state", payload: payload2, seq: 2 });
    expect(onStateUpdate).toHaveBeenCalledTimes(2);
    expect(onStateUpdate).toHaveBeenCalledWith(payload2);
  });

  it("ignores out-of-order seq messages", () => {
    const onStateUpdate = vi.fn();
    renderHook(() => useWebSocket({ ...defaultParams, onStateUpdate }));
    vi.advanceTimersByTime(1);

    const ws = getLastWs();

    // Receive seq 5
    ws.simulateMessage({ type: "state", payload: { v: 5 }, seq: 5 });
    expect(onStateUpdate).toHaveBeenCalledTimes(1);

    // Receive seq 3 (out of order) — should be ignored
    ws.simulateMessage({ type: "state", payload: { v: 3 }, seq: 3 });
    expect(onStateUpdate).toHaveBeenCalledTimes(1);

    // Receive seq 5 again (duplicate) — should be ignored
    ws.simulateMessage({ type: "state", payload: { v: 5 }, seq: 5 });
    expect(onStateUpdate).toHaveBeenCalledTimes(1);

    // Receive seq 6 — should be accepted
    ws.simulateMessage({ type: "state", payload: { v: 6 }, seq: 6 });
    expect(onStateUpdate).toHaveBeenCalledTimes(2);
  });

  it("sends ping every 25s and handles pong", async () => {
    renderHook(() => useWebSocket({ ...defaultParams }));
    await vi.advanceTimersByTimeAsync(1);

    const ws = getLastWs();

    // Authenticate first (ping starts after first state message)
    ws.simulateMessage({ type: "state", payload: {}, seq: 1 });

    // No pings yet
    expect(ws.sentMessages).toHaveLength(0);

    // Advance 25s — first ping
    await vi.advanceTimersByTimeAsync(25_000);
    expect(ws.sentMessages).toHaveLength(1);
    expect(JSON.parse(ws.sentMessages[0])).toEqual({ type: "ping" });

    // Server responds with pong
    ws.simulateMessage({ type: "pong" });

    // Advance another 25s — second ping
    await vi.advanceTimersByTimeAsync(25_000);
    expect(ws.sentMessages).toHaveLength(2);
    expect(JSON.parse(ws.sentMessages[1])).toEqual({ type: "ping" });
  });

  it("does not connect when disabled", () => {
    renderHook(() => useWebSocket({ ...defaultParams, enabled: false }));
    vi.advanceTimersByTime(1);

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("disconnects and cleans up on unmount", async () => {
    const { unmount } = renderHook(() => useWebSocket({ ...defaultParams }));
    await vi.advanceTimersByTimeAsync(1);

    expect(MockWebSocket.instances).toHaveLength(1);
    const ws = getLastWs();

    unmount();

    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });

  it("calls onError for non-auth error messages", () => {
    const onError = vi.fn();
    renderHook(() => useWebSocket({ ...defaultParams, onError }));
    vi.advanceTimersByTime(1);

    const ws = getLastWs();
    ws.simulateMessage({ type: "error", code: "INVALID_TOKEN", message: "Bad token" });

    expect(onError).toHaveBeenCalledWith("Bad token");
  });

  it("reconnects on pong timeout", async () => {
    renderHook(() => useWebSocket({ ...defaultParams }));
    await vi.advanceTimersByTimeAsync(1);

    const ws = getLastWs();

    // Authenticate to start ping timer
    ws.simulateMessage({ type: "state", payload: {}, seq: 1 });

    // Advance 25s — ping sent
    await vi.advanceTimersByTimeAsync(25_000);
    expect(ws.sentMessages).toHaveLength(1);

    // Don't send pong — wait 5s for timeout
    const instancesBefore = MockWebSocket.instances.length;
    await vi.advanceTimersByTimeAsync(5_000);

    // Should have reconnected (old WS closed, new one created after backoff)
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);

    // Wait for backoff (1s)
    await vi.advanceTimersByTimeAsync(1_000);
    expect(MockWebSocket.instances.length).toBeGreaterThan(instancesBefore);
  });
});

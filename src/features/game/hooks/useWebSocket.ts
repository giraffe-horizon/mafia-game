"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { GameStateResponse } from "@/db";
import type { WsServerMessage } from "../types";

export interface UseWebSocketParams {
  gameId: string;
  token: string;
  wsUrl: string;
  onStateUpdate: (payload: GameStateResponse) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

const PING_INTERVAL = 25_000;
const PONG_TIMEOUT = 5_000;
const MAX_BACKOFF = 30_000;
const VISIBILITY_TIMEOUT = 60_000;

export function useWebSocket({
  gameId,
  token,
  wsUrl,
  onStateUpdate,
  onError,
  enabled = true,
}: UseWebSocketParams): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);
  const lastSeqRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Keep callbacks fresh without triggering reconnects
  const onStateUpdateRef = useRef(onStateUpdate);
  onStateUpdateRef.current = onStateUpdate;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const closeWs = useCallback(() => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearTimers]);

  // scheduleReconnect and connect use a ref-based pattern to avoid circular deps
  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = backoffRef.current;
    backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connectRef.current();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !wsUrl || !gameId || !token) return;

    closeWs();

    const url = `${wsUrl}/ws/game?gameId=${encodeURIComponent(gameId)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      // Wait for AUTH_REQUIRED from server — don't send auth proactively
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: WsServerMessage & { code?: string };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (msg.type === "error" && msg.code === "AUTH_REQUIRED") {
        ws.send(JSON.stringify({ type: "auth", token }));
        return;
      }

      if (msg.type === "error") {
        onErrorRef.current?.(msg.message);
        return;
      }

      if (msg.type === "pong") {
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }
        return;
      }

      if (msg.type === "state") {
        // First state message = authenticated & connected
        setIsConnected(true);
        backoffRef.current = 1000; // Reset backoff on successful connection

        if (msg.seq > lastSeqRef.current) {
          lastSeqRef.current = msg.seq;
          onStateUpdateRef.current(msg.payload as GameStateResponse);
        }

        // Start ping interval after first state (connection is live)
        if (!pingIntervalRef.current) {
          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "ping" }));
              pongTimeoutRef.current = setTimeout(() => {
                // Pong timeout — force reconnect
                closeWs();
                scheduleReconnect();
              }, PONG_TIMEOUT);
            }
          }, PING_INTERVAL);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      clearTimers();
      if (mountedRef.current) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror — reconnect is handled there
    };
  }, [wsUrl, gameId, token, closeWs, clearTimers, scheduleReconnect]);

  // Keep connectRef in sync
  connectRef.current = connect;

  // Visibility API — disconnect after 60s hidden, reconnect when visible
  useEffect(() => {
    if (!enabled || !wsUrl) return;

    let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        visibilityTimeout = setTimeout(() => {
          closeWs();
        }, VISIBILITY_TIMEOUT);
      } else {
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
          visibilityTimeout = null;
        }

        const hiddenDuration = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        hiddenAtRef.current = null;

        // Reconnect if WS was closed while hidden
        if (hiddenDuration >= VISIBILITY_TIMEOUT || !wsRef.current) {
          lastSeqRef.current = 0; // Reset seq to get fresh state
          connectRef.current();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
    };
  }, [enabled, wsUrl, closeWs]);

  // Main connection effect
  useEffect(() => {
    mountedRef.current = true;

    if (enabled && wsUrl) {
      connectRef.current();
    }

    return () => {
      mountedRef.current = false;
      closeWs();
    };
  }, [enabled, wsUrl, gameId, token, closeWs]);

  const reconnect = useCallback(() => {
    backoffRef.current = 1000;
    lastSeqRef.current = 0;
    connectRef.current();
  }, []);

  const disconnect = useCallback(() => {
    closeWs();
  }, [closeWs]);

  return {
    isConnected,
    reconnect,
    disconnect,
  };
}

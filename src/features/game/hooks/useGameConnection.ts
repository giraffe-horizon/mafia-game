"use client";

import { useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import { useGameStore } from "@/features/game/store/gameStore";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "";
const REFRESH_DEBOUNCE_MS = 150;

export interface UseGameConnectionParams {
  token: string;
  gameId: string;
}

export interface UseGameConnectionReturn {
  wsConnected: boolean;
}

/**
 * Manages WebSocket connection + polling fallback for a game session.
 * When WS is connected, polling stops. When WS disconnects, polling resumes.
 */
export function useGameConnection({
  token,
  gameId,
}: UseGameConnectionParams): UseGameConnectionReturn {
  const refetch = useGameStore((s) => s.refetch);
  const setWsConnected = useGameStore((s) => s.setWsConnected);
  const setWsError = useGameStore((s) => s.setWsError);
  const startPolling = useGameStore((s) => s.startPolling);
  const stopPolling = useGameStore((s) => s.stopPolling);
  const setPhaseDeadline = useGameStore((s) => s.setPhaseDeadline);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRefresh = useCallback(() => {
    // Debounce: if server broadcasts multiple refreshes in quick succession, only fetch once
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      refetch();
    }, REFRESH_DEBOUNCE_MS);
  }, [refetch]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const onTimerUpdate = useCallback(
    (deadline: string, remainingMs: number) => {
      setPhaseDeadline(deadline, remainingMs);
    },
    [setPhaseDeadline]
  );

  const onWsError = useCallback(
    (errorMsg: string) => {
      setWsError(errorMsg);
    },
    [setWsError]
  );

  const { isConnected: wsIsConnected } = useWebSocket({
    gameId,
    token,
    wsUrl: WS_URL,
    onRefresh,
    onTimerUpdate,
    onError: onWsError,
    enabled: !!WS_URL && !!gameId,
  });

  // Sync hook's isConnected → store's wsConnected + hybrid polling toggle
  useEffect(() => {
    if (!WS_URL) return;

    setWsConnected(wsIsConnected);

    if (wsIsConnected) {
      stopPolling();
      setWsError(null);
    } else {
      // WS disconnected — fall back to polling
      startPolling();
    }
  }, [wsIsConnected, stopPolling, startPolling, setWsConnected, setWsError]);

  return { wsConnected: wsIsConnected };
}

import { useEffect, useState, useCallback, useRef } from "react";
import type { GameStateResponse } from "@/db";
import * as apiClient from "@/lib/api-client";

// Polling constants
const POLL_INTERVAL = 2000;
const TOAST_DURATION = 7000;
const MAX_BACKOFF = 16000;

interface Toast {
  id: string;
  content: string;
}

interface UseGamePollingReturn {
  state: GameStateResponse | null;
  error: string;
  setError: (error: string) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  refetch: () => Promise<void>;
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;
}

export function useGamePolling(token: string): UseGamePollingReturn {
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [characters, setCharacters] = useState<
    Array<{ id: string; slug: string; name: string; name_pl: string; avatar_url: string }>
  >([]);
  const shownMessageIds = useRef<Set<string>>(new Set());
  const backoffDelay = useRef(POLL_INTERVAL);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await apiClient.fetchGameState(token);
      setState(data);
      // Reset backoff on success
      backoffDelay.current = POLL_INTERVAL;

      for (const msg of data.messages) {
        if (!shownMessageIds.current.has(msg.id)) {
          shownMessageIds.current.add(msg.id);
          setToasts((prev) => [...prev, { id: msg.id, content: msg.content }]);
          setTimeout(
            () => setToasts((prev) => prev.filter((t) => t.id !== msg.id)),
            TOAST_DURATION
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        setError("Sesja nie istnieje");
        return;
      }
      // Exponential backoff on errors
      backoffDelay.current = Math.min(backoffDelay.current * 2, MAX_BACKOFF);
    }
  }, [token]);

  const scheduleNext = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    intervalRef.current = setTimeout(() => {
      // Don't poll when tab is not visible
      if (document.visibilityState === "hidden") {
        // Reschedule when tab becomes visible
        scheduleNext();
        return;
      }

      fetchState().then(() => {
        // Schedule next poll with current backoff delay
        scheduleNext();
      });
    }, backoffDelay.current);
  }, [fetchState]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initial fetch and start polling
    fetchState().then(() => {
      scheduleNext();
    });

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became active - immediate fetch and restart polling
        fetchState().then(() => {
          scheduleNext();
        });
      }
      // No need to stop polling on hidden - the scheduleNext handles it
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchState, scheduleNext, stopPolling]);

  useEffect(() => {
    apiClient
      .fetchCharacters()
      .then(setCharacters)
      .catch(() => {});
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    state,
    error,
    setError,
    toasts,
    dismissToast,
    refetch: fetchState,
    characters,
  };
}

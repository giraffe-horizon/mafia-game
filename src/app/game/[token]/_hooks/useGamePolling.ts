import { useEffect, useState, useCallback, useRef } from "react";
import type { GameStateResponse } from "@/lib/db";
import * as apiClient from "@/lib/api-client";

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

  const fetchState = useCallback(async () => {
    try {
      const data = await apiClient.fetchGameState(token);
      setState(data);
      for (const msg of data.messages) {
        if (!shownMessageIds.current.has(msg.id)) {
          shownMessageIds.current.add(msg.id);
          setToasts((prev) => [...prev, { id: msg.id, content: msg.content }]);
          setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== msg.id)), 7000);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        setError("Sesja nie istnieje");
        return;
      }
      /* silent retry */
    }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

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

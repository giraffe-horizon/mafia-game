import type { StateCreator } from "zustand";
import type { GameStateResponse } from "@/db";
import type { GameService } from "@/features/game/service";
import type { GameState } from "@/features/game/store/gameStore";
import { getErrorMessage } from "@/lib/errors";

// Polling constants
const POLL_INTERVAL = 2000;
const TOAST_DURATION = 7000;
const MAX_BACKOFF = 16000;

export interface GameSlice {
  // Core state
  state: GameStateResponse | null;
  error: string;
  isPolling: boolean;
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;

  // Internal polling state
  _gameService: GameService | null;
  _token: string | null;
  _intervalRef: NodeJS.Timeout | null;
  _backoffDelay: number;
  _shownMessageIds: Set<string>;
  _toastTimeouts: Map<string, NodeJS.Timeout>;
  _isFetching: boolean;
  _scheduleNext: () => void;
  _visibilityCleanup?: () => void;

  // Actions
  initialize: (token: string, service: GameService) => void;
  startPolling: () => void;
  stopPolling: () => void;
  refetch: () => Promise<void>;
  setError: (error: string) => void;
}

export const createGameSlice: StateCreator<GameState, [], [], GameSlice> = (set, get) => ({
  state: null,
  error: "",
  isPolling: false,
  characters: [],

  _gameService: null,
  _token: null,
  _intervalRef: null,
  _backoffDelay: POLL_INTERVAL,
  _shownMessageIds: new Set(),
  _toastTimeouts: new Map(),
  _isFetching: false,

  _scheduleNext: () => {
    const state = get();
    if (state._intervalRef) {
      clearTimeout(state._intervalRef);
    }

    if (document.visibilityState === "hidden") {
      set({ _intervalRef: null });
      return;
    }

    const intervalId = setTimeout(() => {
      get()
        .refetch()
        .then(() => {
          get()._scheduleNext();
        });
    }, state._backoffDelay);

    set({ _intervalRef: intervalId });
  },

  initialize: (token: string, service: GameService) => {
    const state = get();

    if (state._intervalRef) {
      clearTimeout(state._intervalRef);
    }

    set({
      _gameService: service,
      _token: token,
      _backoffDelay: POLL_INTERVAL,
      _shownMessageIds: new Set(),
      state: null,
      toasts: [],
      characters: [],
      ranking: [],
      rankingMeta: null,
      roundScores: [],
      error: "",
      actionPending: false,
      actionError: "",
      phasePending: false,
      starting: false,
      changingDecision: false,
    });

    service
      .fetchCharacters()
      .then((characters) => set({ characters }))
      .catch((error) => {
        const msg = getErrorMessage(error, String(error));
        console.error("Failed to fetch characters:", msg);
        set({ error: `Nie udało się pobrać postaci: ${msg}` });
      });

    get().startPolling();
  },

  startPolling: () => {
    const state = get();
    if (!state._gameService || !state._token || state.isPolling) return;

    if (state._visibilityCleanup) {
      state._visibilityCleanup();
    }

    set({ isPolling: true });

    get()
      .refetch()
      .then(() => {
        get()._scheduleNext();
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const current = get();
        if (current._intervalRef) {
          clearTimeout(current._intervalRef);
          set({ _intervalRef: null });
        }
        get()
          .refetch()
          .then(() => {
            get()._scheduleNext();
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    set({
      _visibilityCleanup: () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      },
    });
  },

  stopPolling: () => {
    const state = get();
    if (state._intervalRef) {
      clearTimeout(state._intervalRef);
      set({ _intervalRef: null });
    }

    if (state._visibilityCleanup) {
      state._visibilityCleanup();
      set({ _visibilityCleanup: undefined });
    }

    for (const timeoutId of state._toastTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    state._toastTimeouts.clear();

    set({ isPolling: false });
  },

  refetch: async () => {
    const { _gameService, _token, _shownMessageIds, _isFetching } = get();
    if (!_gameService || !_token) return;
    if (_isFetching) return;
    set({ _isFetching: true });

    try {
      const data = await _gameService.fetchState(_token);
      set({ state: data, _backoffDelay: POLL_INTERVAL });

      const currentToasts = get().toasts;
      const newToasts = [...currentToasts];

      for (const msg of data.messages) {
        if (!_shownMessageIds.has(msg.id)) {
          _shownMessageIds.add(msg.id);
          const newToast = { id: msg.id, content: msg.content };
          newToasts.push(newToast);

          const timeoutId = setTimeout(() => {
            get()._toastTimeouts.delete(msg.id);
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== msg.id),
            }));
          }, TOAST_DURATION);
          get()._toastTimeouts.set(msg.id, timeoutId);
        }
      }

      if (newToasts.length > currentToasts.length) {
        set({ toasts: newToasts });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        set({ error: "Sesja nie istnieje" });
        return;
      }
      set((state) => ({
        _backoffDelay: Math.min(state._backoffDelay * 2, MAX_BACKOFF),
      }));
    } finally {
      set({ _isFetching: false });
    }
  },

  setError: (error: string) => set({ error }),
});

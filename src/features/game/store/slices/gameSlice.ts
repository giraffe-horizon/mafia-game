import type { StateCreator } from "zustand";
import type { GameStateResponse } from "@/db";
import type { GameService } from "@/features/game/service";
import type { GameState } from "@/features/game/store/gameStore";
import { getErrorMessage } from "@/lib/errors";
import { ApiError } from "@/lib/api-client";
import { buildTransition } from "@/features/game/store/buildTransition";

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
  _shownMissionIds: Set<string>;
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
  _shownMissionIds: new Set(),
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
      _shownMissionIds: new Set(),
      state: null,
      toasts: [],
      characters: [],
      ranking: [],
      rankingMeta: null,
      roundScores: [],
      error: "",
      roleVisible: false,
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
    const { _gameService, _token, _shownMessageIds } = get();
    if (!_gameService || !_token) return;
    // Atomic check-and-set to prevent concurrent fetches
    if (get()._isFetching) return;
    set({ _isFetching: true });

    try {
      const data = await _gameService.fetchState(_token);
      const prevPhase = get().state?.game?.phase;
      const newPhase = data.game?.phase;
      const phaseChanged = prevPhase != null && newPhase != null && prevPhase !== newPhase;

      // Set transition BEFORE updating state so the overlay blocks the view
      if (phaseChanged) {
        const transition = buildTransition(
          prevPhase,
          newPhase,
          data.game.round,
          data.lastPhaseResult,
          data.game.winner
        );
        if (transition) {
          set({ transition });
        }

        // Auto-switch active tab on phase change
        // GM doesn't have night tab — fall back to day
        const isHost = data.currentPlayer?.isHost ?? false;
        if (newPhase === "night") get().setActiveTab(isHost ? "day" : "night");
        else if (newPhase === "day") get().setActiveTab("day");
        else if (newPhase === "voting") get().setActiveTab("archive");
        // review/ended: stay on current tab

        // Set notification badges for inactive tabs when phase changes
        const currentTab = get().activeTab;
        if (newPhase === "day" && currentTab !== "night") {
          // Nowe wyniki nocy - badge na "Noc" tab
          get().setTabNotification("night", true);
        }
        if (newPhase === "voting" && currentTab !== "archive") {
          // Nowe głosowanie - badge na "Archiwum" tab
          get().setTabNotification("archive", true);
        }
      }

      const prevRound = get().state?.game?.round;
      const newRound = data.game?.round;
      const roundChanged =
        prevRound !== undefined && newRound !== undefined && prevRound !== newRound;
      set({
        state: data,
        _backoffDelay: POLL_INTERVAL,
        ...(roundChanged ? { roleVisible: false } : {}),
      });

      // Suppress toasts during phase transitions — the transition screens
      // already convey kill/vote results
      if (!phaseChanged) {
        const currentToasts = get().toasts;
        const newToasts = [...currentToasts];

        for (const msg of data.messages) {
          if (!_shownMessageIds.has(msg.id)) {
            _shownMessageIds.add(msg.id);
            const newToast = { id: msg.id, content: msg.content };
            newToasts.push(newToast);

            // Set notification badge for "agents" tab if new message appears
            const currentTab = get().activeTab;
            if (currentTab !== "agents" && !msg.eventType) {
              // Regular GM message (not system event) - badge on "Agenci" tab
              get().setTabNotification("agents", true);
            }

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
      } else {
        // Mark messages as shown so they don't appear as toasts later
        for (const msg of data.messages) {
          _shownMessageIds.add(msg.id);
        }
      }

      // Detect new missions and show toast + badge
      const { _shownMissionIds } = get();
      for (const mission of data.missions) {
        if (!_shownMissionIds.has(mission.id)) {
          _shownMissionIds.add(mission.id);

          // Only show toast if this is not the first fetch (state was already loaded)
          if (prevPhase != null) {
            const missionToast = {
              id: `mission-${mission.id}`,
              content: `Nowa misja: ${mission.description}`,
            };
            set((s) => ({ toasts: [...s.toasts, missionToast] }));

            const timeoutId = setTimeout(() => {
              get()._toastTimeouts.delete(missionToast.id);
              set((s) => ({
                toasts: s.toasts.filter((t) => t.id !== missionToast.id),
              }));
            }, TOAST_DURATION);
            get()._toastTimeouts.set(missionToast.id, timeoutId);

            // Badge on "Agenci" tab
            const currentTab = get().activeTab;
            if (currentTab !== "agents") {
              get().setTabNotification("agents", true);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
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

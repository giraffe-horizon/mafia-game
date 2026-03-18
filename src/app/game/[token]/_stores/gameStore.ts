import { create } from "zustand";
import type { GameStateResponse, ActionType, GamePhase } from "@/db";
import type {
  GameService,
  ActionResult,
  LeaveResult,
  StartGameOpts,
} from "../_services/gameService";
import * as apiClient from "@/lib/api-client"; // only for fetchCharacters

// Polling constants
const POLL_INTERVAL = 2000;
const TOAST_DURATION = 7000;
const MAX_BACKOFF = 16000;

export interface Toast {
  id: string;
  content: string;
}

interface GameState {
  // Core state
  state: GameStateResponse | null;
  error: string;
  isPolling: boolean;

  // Characters for selection
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;

  // Toasts for messages
  toasts: Toast[];

  // Loading states
  actionPending: boolean;
  actionError: string;
  phasePending: boolean;
  starting: boolean;
  changingDecision: boolean;

  // Internal polling state
  _gameService: GameService | null;
  _token: string | null;
  _intervalRef: NodeJS.Timeout | null;
  _backoffDelay: number;
  _shownMessageIds: Set<string>;
  _scheduleNext: () => void;
  _visibilityCleanup?: () => void;

  // Actions
  initialize: (token: string, service: GameService) => void;
  startPolling: () => void;
  stopPolling: () => void;
  refetch: () => Promise<void>;
  setError: (error: string) => void;

  // Game actions
  submitAction: (type: ActionType, targetPlayerId?: string) => Promise<ActionResult>;
  advancePhase: (phase: GamePhase) => Promise<ActionResult>;
  startGame: (gameMode: "full" | "simple", mafiaCount: number) => Promise<ActionResult>;
  kickPlayer: (playerId: string) => Promise<ActionResult>;
  leaveGame: () => Promise<LeaveResult>;
  rematchGame: (mafiaCountSetting: number) => Promise<ActionResult>;
  transferGameMaster: (newHostPlayerId: string) => Promise<ActionResult>;
  submitGmAction: (
    forPlayerId: string,
    actionType: ActionType,
    targetPlayerId?: string
  ) => Promise<ActionResult>;
  finalizeGame: () => Promise<ActionResult>;

  // Toast management
  dismissToast: (id: string) => void;

  // State setters
  setChangingDecision: (changing: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  state: null,
  error: "",
  isPolling: false,
  characters: [],
  toasts: [],

  // Loading states
  actionPending: false,
  actionError: "",
  phasePending: false,
  starting: false,
  changingDecision: false,

  // Internal state
  _gameService: null,
  _token: null,
  _intervalRef: null,
  _backoffDelay: POLL_INTERVAL,
  _shownMessageIds: new Set(),

  _scheduleNext: () => {
    const state = get();
    if (state._intervalRef) {
      clearTimeout(state._intervalRef);
    }

    const intervalId = setTimeout(() => {
      // Don't poll when tab is not visible
      if (document.visibilityState === "hidden") {
        // Reschedule when tab becomes visible
        get()._scheduleNext();
        return;
      }

      get()
        .refetch()
        .then(() => {
          // Schedule next poll with current backoff delay
          get()._scheduleNext();
        });
    }, state._backoffDelay);

    set({ _intervalRef: intervalId });
  },

  initialize: (token: string, service: GameService) => {
    const state = get();

    // Stop any existing polling
    if (state._intervalRef) {
      clearTimeout(state._intervalRef);
    }

    set({
      _gameService: service,
      _token: token,
      _backoffDelay: POLL_INTERVAL,
      _shownMessageIds: new Set(),
      error: "",
    });

    // Fetch characters
    apiClient
      .fetchCharacters()
      .then((characters) => set({ characters }))
      .catch(() => {});

    // Start polling
    get().startPolling();
  },

  startPolling: () => {
    const state = get();
    if (!state._gameService || !state._token || state.isPolling) return;

    set({ isPolling: true });

    // Initial fetch
    get()
      .refetch()
      .then(() => {
        get()._scheduleNext();
      });

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became active - immediate fetch and restart polling
        get()
          .refetch()
          .then(() => {
            get()._scheduleNext();
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Store cleanup function in a way that can be accessed later
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

    // Clean up visibility listener
    if (state._visibilityCleanup) {
      state._visibilityCleanup();
    }

    set({ isPolling: false });
  },

  refetch: async () => {
    const { _gameService, _token, _shownMessageIds } = get();
    if (!_gameService || !_token) return;

    try {
      const data = await _gameService.fetchState(_token);
      set({ state: data, _backoffDelay: POLL_INTERVAL });

      // Handle new messages as toasts
      const currentToasts = get().toasts;
      const newToasts = [...currentToasts];

      for (const msg of data.messages) {
        if (!_shownMessageIds.has(msg.id)) {
          _shownMessageIds.add(msg.id);
          const newToast = { id: msg.id, content: msg.content };
          newToasts.push(newToast);

          // Auto-dismiss after duration
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== msg.id),
            }));
          }, TOAST_DURATION);
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
      // Exponential backoff on errors
      set((state) => ({
        _backoffDelay: Math.min(state._backoffDelay * 2, MAX_BACKOFF),
      }));
    }
  },

  setError: (error: string) => set({ error }),

  // Game actions
  submitAction: async (type: ActionType, targetPlayerId?: string): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    set({ actionPending: true, actionError: "" });
    try {
      const result = await _gameService.submitAction(_token, type, targetPlayerId);
      if (result.success) {
        await get().refetch();
      } else {
        set({ actionError: result.error || "Błąd połączenia" });
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      set({ actionError: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ actionPending: false });
    }
  },

  advancePhase: async (phase: GamePhase): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    set({ phasePending: true });
    try {
      const result = await _gameService.advancePhase(_token, phase);
      if (result.success) {
        await get().refetch();
      } else {
        set({ error: result.error || "Błąd zmiany fazy" });
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd zmiany fazy";
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ phasePending: false });
    }
  },

  startGame: async (gameMode: "full" | "simple", mafiaCount: number): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    set({ starting: true });
    try {
      const opts: StartGameOpts = { mode: gameMode };
      if (mafiaCount > 0) opts.mafiaCount = mafiaCount;

      const result = await _gameService.startGame(_token, opts);
      if (result.success) {
        await get().refetch();
      } else {
        set({ error: result.error || "Błąd połączenia" });
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ starting: false });
    }
  },

  kickPlayer: async (playerId: string): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const result = await _gameService.kickPlayer(_token, playerId);
      if (result.success) {
        await get().refetch();
      }
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Błąd połączenia" };
    }
  },

  leaveGame: async (): Promise<LeaveResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token)
      return { success: false, gameEnded: false, error: "No service initialized" };

    try {
      const result = await _gameService.leaveGame(_token);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      set({ error: errorMsg });
      return { success: false, gameEnded: false, error: errorMsg };
    }
  },

  rematchGame: async (mafiaCountSetting: number): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const opts: StartGameOpts = {};
      if (mafiaCountSetting > 0) opts.mafiaCount = mafiaCountSetting;

      const result = await _gameService.rematchGame(_token, opts);
      if (result.success) {
        await get().refetch();
      } else {
        set({ error: result.error || "Błąd połączenia" });
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  transferGameMaster: async (newHostPlayerId: string): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const result = await _gameService.transferGameMaster(_token, newHostPlayerId);
      if (result.success) {
        await get().refetch();
      }
      return result;
    } catch {
      return { success: false };
    }
  },

  submitGmAction: async (
    forPlayerId: string,
    actionType: ActionType,
    targetPlayerId?: string
  ): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const result = await _gameService.submitGmAction(
        _token,
        forPlayerId,
        actionType,
        targetPlayerId
      );

      if (result.success) {
        await get().refetch();
      } else {
        set({ actionError: result.error || "Błąd połączenia" });
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      set({ actionError: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  finalizeGame: async (): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const result = await _gameService.finalizeGame(_token);
      if (result.success) {
        await get().refetch();
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      return { success: false, error: errorMsg };
    }
  },

  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setChangingDecision: (changing: boolean) => set({ changingDecision: changing }),
}));

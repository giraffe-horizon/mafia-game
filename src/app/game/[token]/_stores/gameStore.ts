import { create } from "zustand";
import type { GameStateResponse, ActionType, GamePhase } from "@/db";
import type {
  GameService,
  ActionResult,
  RematchResult,
  LeaveResult,
  StartGameOpts,
} from "@/app/game/[token]/_services/gameService";

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

  // Ranking & scores
  ranking: Array<{
    playerId: string;
    nickname: string;
    role: string | null;
    isAlive: boolean;
    missionPoints: number;
    missionsDone: number;
    missionsTotal: number;
    survived: boolean;
    won: boolean;
    totalScore: number;
    roundsPlayed: number;
  }>;
  rankingMeta: { gameStatus: string; winner: string | null; round: number } | null;
  roundScores: Array<{
    playerId: string;
    nickname: string;
    missionPoints: number;
    survived: boolean;
    won: boolean;
    totalScore: number;
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

  // Game actions
  submitAction: (type: ActionType, targetPlayerId?: string) => Promise<ActionResult>;
  advancePhase: (phase: GamePhase) => Promise<ActionResult>;
  startGame: (gameMode: "full" | "simple", mafiaCount: number) => Promise<ActionResult>;
  kickPlayer: (playerId: string) => Promise<ActionResult>;
  leaveGame: () => Promise<LeaveResult>;
  rematchGame: (mafiaCountSetting?: number) => Promise<RematchResult>;
  transferGameMaster: (newHostPlayerId: string) => Promise<ActionResult>;
  submitGmAction: (
    forPlayerId: string,
    actionType: ActionType,
    targetPlayerId?: string
  ) => Promise<ActionResult>;
  finalizeGame: () => Promise<ActionResult>;

  // Ranking & scores
  fetchRanking: () => Promise<void>;
  fetchRoundScores: () => Promise<void>;

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
  ranking: [],
  rankingMeta: null,
  roundScores: [],
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
  _toastTimeouts: new Map(),
  _isFetching: false,

  _scheduleNext: () => {
    const state = get();
    if (state._intervalRef) {
      clearTimeout(state._intervalRef);
    }

    // Don't schedule when tab is hidden — visibility handler will restart polling
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

    // Stop any existing polling
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

    // Fetch characters
    service
      .fetchCharacters()
      .then((characters) => set({ characters }))
      .catch((error) => {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Failed to fetch characters:", msg);
        set({ error: `Nie udało się pobrać postaci: ${msg}` });
      });

    // Start polling
    get().startPolling();
  },

  startPolling: () => {
    const state = get();
    if (!state._gameService || !state._token || state.isPolling) return;

    // Clean up any existing visibility listener before adding a new one
    if (state._visibilityCleanup) {
      state._visibilityCleanup();
    }

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
        // Clear existing polling chain to prevent duplicates
        const current = get();
        if (current._intervalRef) {
          clearTimeout(current._intervalRef);
          set({ _intervalRef: null });
        }
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
      set({ _visibilityCleanup: undefined });
    }

    // Clean up toast timeouts
    for (const timeoutId of state._toastTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    state._toastTimeouts.clear();

    set({ isPolling: false });
  },

  refetch: async () => {
    const { _gameService, _token, _shownMessageIds, _isFetching } = get();
    if (!_gameService || !_token) return;
    if (_isFetching) return; // prevent concurrent fetches
    set({ _isFetching: true });

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

          // Auto-dismiss after duration (tracked for cleanup)
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
      // Exponential backoff on errors
      set((state) => ({
        _backoffDelay: Math.min(state._backoffDelay * 2, MAX_BACKOFF),
      }));
    } finally {
      set({ _isFetching: false });
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

  rematchGame: async (mafiaCountSetting?: number): Promise<RematchResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const opts: StartGameOpts = {};
      if (mafiaCountSetting && mafiaCountSetting > 0) opts.mafiaCount = mafiaCountSetting;

      const result = await _gameService.rematchGame(_token, opts);
      if (result.success) {
        // Game reset to lobby in-place — just refetch state
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Błąd połączenia";
      return { success: false, error: errorMsg };
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

  fetchRanking: async () => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return;
    try {
      const data = await _gameService.fetchRanking(_token);
      set({
        ranking: data.ranking,
        rankingMeta: { gameStatus: data.gameStatus, winner: data.winner, round: data.round },
      });
    } catch {
      // Ranking is optional — don't break the UI
    }
  },

  fetchRoundScores: async () => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return;
    try {
      const data = await _gameService.fetchRoundScores(_token);
      set({ roundScores: data.scores });
    } catch {
      // Scores are optional — don't break the UI
    }
  },

  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setChangingDecision: (changing: boolean) => set({ changingDecision: changing }),
}));

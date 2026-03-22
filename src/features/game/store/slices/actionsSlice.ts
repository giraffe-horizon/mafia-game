import type { StateCreator } from "zustand";
import type { ActionType } from "@/db";
import type {
  ActionResult,
  RematchResult,
  LeaveResult,
  StartGameOpts,
} from "@/features/game/service";
import type { PhaseInput } from "@/lib/api/schemas";
import type { GameState } from "@/features/game/store/gameStore";
import { getErrorMessage } from "@/lib/errors";

export interface ActionsSlice {
  submitAction: (type: ActionType, targetPlayerId?: string) => Promise<ActionResult>;
  advancePhase: (phase: PhaseInput["phase"]) => Promise<ActionResult>;
  startGame: (
    gameMode: "full" | "simple",
    mafiaCount: number,
    secretVoting?: boolean
  ) => Promise<ActionResult>;
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
  setPhaseTimer: (durationSeconds: number) => Promise<ActionResult>;
  clearPhaseTimer: () => Promise<ActionResult>;
}

export const createActionsSlice: StateCreator<GameState, [], [], ActionsSlice> = (set, get) => ({
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
      const errorMsg = getErrorMessage(error);
      set({ actionError: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ actionPending: false });
    }
  },

  advancePhase: async (phase: PhaseInput["phase"]): Promise<ActionResult> => {
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
      const errorMsg = getErrorMessage(error, "Błąd zmiany fazy");
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ phasePending: false });
    }
  },

  startGame: async (
    gameMode: "full" | "simple",
    mafiaCount: number,
    secretVoting?: boolean
  ): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    set({ starting: true });
    try {
      const opts: StartGameOpts = { mode: gameMode };
      if (mafiaCount > 0) opts.mafiaCount = mafiaCount;
      if (typeof secretVoting === "boolean") opts.secretVoting = secretVoting;

      const result = await _gameService.startGame(_token, opts);
      if (result.success) {
        await get().refetch();
      } else {
        set({ error: result.error || "Błąd połączenia" });
      }
      return result;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
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
      return { success: false, error: getErrorMessage(error) };
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
      const errorMsg = getErrorMessage(error);
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
        await get().refetch();
      } else {
        set({ error: result.error || "Błąd połączenia" });
      }
      return result;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
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
      const errorMsg = getErrorMessage(error);
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
      const errorMsg = getErrorMessage(error);
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
      const errorMsg = getErrorMessage(error);
      return { success: false, error: errorMsg };
    }
  },

  setPhaseTimer: async (durationSeconds: number): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const result = await _gameService.setTimer(_token, durationSeconds);
      if (result.success && result.deadline) {
        get().setPhaseDeadline(result.deadline, durationSeconds * 1000);
      }
      return result;
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  clearPhaseTimer: async (): Promise<ActionResult> => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return { success: false, error: "No service initialized" };

    try {
      const result = await _gameService.clearTimer(_token);
      if (result.success) {
        get().clearPhaseDeadline();
      }
      return result;
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
});

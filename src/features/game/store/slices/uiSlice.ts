import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";
import type { Toast } from "@/features/game/types";

export type { Toast };

export interface UiSlice {
  // Toasts
  toasts: Toast[];
  dismissToast: (id: string) => void;

  // Loading states
  actionPending: boolean;
  actionError: string;
  phasePending: boolean;
  starting: boolean;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;
}

export const createUiSlice: StateCreator<GameState, [], [], UiSlice> = (set) => ({
  toasts: [],
  actionPending: false,
  actionError: "",
  phasePending: false,
  starting: false,
  changingDecision: false,

  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setChangingDecision: (changing: boolean) => set({ changingDecision: changing }),
});

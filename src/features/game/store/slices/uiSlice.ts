import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";
import type { Toast } from "@/features/game/types";

export type { Toast };

export interface UiSlice {
  // Toasts
  toasts: Toast[];
  dismissToast: (id: string) => void;

  // Role visibility (persists across phase changes)
  roleVisible: boolean;
  setRoleVisible: (visible: boolean) => void;
  toggleRole: () => void;

  // Loading states
  actionPending: boolean;
  actionError: string;
  phasePending: boolean;
  starting: boolean;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;
}

export const createUiSlice: StateCreator<GameState, [], [], UiSlice> = (set, get) => ({
  toasts: [],
  roleVisible: false,
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

  setRoleVisible: (visible: boolean) => set({ roleVisible: visible }),
  toggleRole: () => set({ roleVisible: !get().roleVisible }),

  setChangingDecision: (changing: boolean) => set({ changingDecision: changing }),
});

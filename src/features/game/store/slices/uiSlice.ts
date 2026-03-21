import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";
import type { Toast, TransitionData } from "@/features/game/types";

export type { Toast };

export interface UiSlice {
  // Toasts
  toasts: Toast[];
  dismissToast: (id: string) => void;

  // Role visibility (persists across phase changes)
  roleVisible: boolean;
  setRoleVisible: (visible: boolean) => void;
  toggleRole: () => void;

  // Active tab (bottom navigation)
  activeTab: "night" | "day" | "archive" | "agents";
  setActiveTab: (tab: "night" | "day" | "archive" | "agents") => void;

  // Tab notifications (badges)
  tabNotifications: Record<string, boolean>;
  setTabNotification: (tab: string, show: boolean) => void;
  clearTabNotification: (tab: string) => void;

  // Loading states
  actionPending: boolean;
  actionError: string;
  phasePending: boolean;
  starting: boolean;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;

  // Transition screens
  transition: TransitionData | null;
  showTransition: (data: TransitionData) => void;
  clearTransition: () => void;
}

export const createUiSlice: StateCreator<GameState, [], [], UiSlice> = (set, get) => ({
  toasts: [],
  roleVisible: false,
  activeTab: "day",
  tabNotifications: {},
  actionPending: false,
  actionError: "",
  phasePending: false,
  starting: false,
  changingDecision: false,
  transition: null,

  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setRoleVisible: (visible: boolean) => set({ roleVisible: visible }),
  toggleRole: () => set({ roleVisible: !get().roleVisible }),

  setChangingDecision: (changing: boolean) => set({ changingDecision: changing }),

  showTransition: (data: TransitionData) => set({ transition: data }),
  clearTransition: () => set({ transition: null }),

  setActiveTab: (tab) =>
    set((state) => ({
      activeTab: tab,
      tabNotifications: {
        ...state.tabNotifications,
        [tab]: false, // Clear notification when user enters tab
      },
    })),

  setTabNotification: (tab: string, show: boolean) =>
    set((state) => ({
      tabNotifications: {
        ...state.tabNotifications,
        [tab]: show,
      },
    })),

  clearTabNotification: (tab: string) =>
    set((state) => ({
      tabNotifications: {
        ...state.tabNotifications,
        [tab]: false,
      },
    })),
});

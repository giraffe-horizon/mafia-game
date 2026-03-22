import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";
import type { Toast, TransitionData } from "@/features/game/types";

export type { Toast };

export type TabId = "night" | "day" | "archive" | "agents";

export interface UiSlice {
  // Toasts
  toasts: Toast[];
  dismissToast: (id: string) => void;

  // Role visibility (persists across phase changes)
  roleVisible: boolean;
  setRoleVisible: (visible: boolean) => void;
  toggleRole: () => void;

  // Active tab (bottom navigation)
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Tab notifications (badge counters)
  tabNotifications: Record<string, number>;
  setTabNotification: (tab: string, count: number) => void;
  incrementTabNotification: (tab: string) => void;
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
        [tab]: 0, // Clear notification when user enters tab
      },
    })),

  setTabNotification: (tab: string, count: number) =>
    set((state) => ({
      tabNotifications: {
        ...state.tabNotifications,
        [tab]: count,
      },
    })),

  incrementTabNotification: (tab: string) =>
    set((state) => ({
      tabNotifications: {
        ...state.tabNotifications,
        [tab]: (state.tabNotifications[tab] ?? 0) + 1,
      },
    })),

  clearTabNotification: (tab: string) =>
    set((state) => ({
      tabNotifications: {
        ...state.tabNotifications,
        [tab]: 0,
      },
    })),
});

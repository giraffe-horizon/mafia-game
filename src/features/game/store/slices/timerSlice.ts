import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";

export interface TimerSlice {
  phaseDeadline: string | null;
  serverRemainingMs: number | null;

  setPhaseDeadline: (deadline: string, remainingMs: number) => void;
  clearPhaseDeadline: () => void;
}

export const createTimerSlice: StateCreator<GameState, [], [], TimerSlice> = (set) => ({
  phaseDeadline: null,
  serverRemainingMs: null,

  setPhaseDeadline: (deadline: string, remainingMs: number) =>
    set({ phaseDeadline: deadline, serverRemainingMs: remainingMs }),

  clearPhaseDeadline: () => set({ phaseDeadline: null, serverRemainingMs: null }),
});

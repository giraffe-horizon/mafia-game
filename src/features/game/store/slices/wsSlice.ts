import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";

export interface WsSlice {
  wsConnected: boolean;
  wsError: string | null;

  setWsConnected: (connected: boolean) => void;
  setWsError: (error: string | null) => void;
}

export const createWsSlice: StateCreator<GameState, [], [], WsSlice> = (set) => ({
  wsConnected: false,
  wsError: null,

  setWsConnected: (connected: boolean) => set({ wsConnected: connected }),

  setWsError: (error: string | null) => set({ wsError: error }),
});

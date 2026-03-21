import type { StateCreator } from "zustand";
import type { GameStateResponse } from "@/db";
import type { GameState } from "@/features/game/store/gameStore";

export interface WsSlice {
  wsConnected: boolean;
  wsError: string | null;
  lastSeq: number;

  setWsConnected: (connected: boolean) => void;
  setWsError: (error: string | null) => void;
  setLastSeq: (seq: number) => void;
  handleWsStateUpdate: (payload: GameStateResponse, seq: number) => void;
}

export const createWsSlice: StateCreator<GameState, [], [], WsSlice> = (set, get) => ({
  wsConnected: false,
  wsError: null,
  lastSeq: 0,

  setWsConnected: (connected: boolean) => set({ wsConnected: connected }),

  setWsError: (error: string | null) => set({ wsError: error }),

  setLastSeq: (seq: number) => set({ lastSeq: seq }),

  handleWsStateUpdate: (payload: GameStateResponse, seq: number) => {
    const { lastSeq } = get();

    // Out-of-order protection
    if (seq <= lastSeq) return;

    set({ lastSeq: seq, state: payload });
  },
});

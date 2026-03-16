import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameStateResponse } from "@/lib/store";

interface GameStore {
  nickname: string;
  setNickname: (name: string) => void;
  gameState: GameStateResponse | null;
  setGameState: (state: GameStateResponse | null) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      nickname: "",
      setNickname: (name) => set({ nickname: name }),
      gameState: null,
      setGameState: (state) => set({ gameState: state }),
    }),
    {
      name: "mafia-game-store",
      partialize: (state) => ({ nickname: state.nickname }),
    }
  )
);

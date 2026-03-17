import { create } from "zustand";
import type { GameStateResponse } from "@/lib/store";

interface GameStore {
  gameState: GameStateResponse | null;
  setGameState: (state: GameStateResponse | null) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  gameState: null,
  setGameState: (state) => set({ gameState: state }),
}));

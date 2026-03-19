import { create } from "zustand";
import { createGameSlice, type GameSlice } from "./slices/gameSlice";
import { createActionsSlice, type ActionsSlice } from "./slices/actionsSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";
import { createScoringSlice, type ScoringSlice } from "./slices/scoringSlice";

// Re-export Toast from uiSlice for backward compatibility
export type { Toast } from "./slices/uiSlice";

export type GameState = GameSlice & ActionsSlice & UiSlice & ScoringSlice;

export const useGameStore = create<GameState>((...a) => ({
  ...createGameSlice(...a),
  ...createActionsSlice(...a),
  ...createUiSlice(...a),
  ...createScoringSlice(...a),
}));

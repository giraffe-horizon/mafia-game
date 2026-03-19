import type { StateCreator } from "zustand";
import type { GameState } from "@/app/game/[token]/_stores/gameStore";

export interface ScoringSlice {
  ranking: Array<{
    playerId: string;
    nickname: string;
    role: string | null;
    isAlive: boolean;
    missionPoints: number;
    missionsDone: number;
    missionsTotal: number;
    survived: boolean;
    won: boolean;
    totalScore: number;
    roundsPlayed: number;
  }>;
  rankingMeta: { gameStatus: string; winner: string | null; round: number } | null;
  roundScores: Array<{
    playerId: string;
    nickname: string;
    missionPoints: number;
    survived: boolean;
    won: boolean;
    totalScore: number;
  }>;

  fetchRanking: () => Promise<void>;
  fetchRoundScores: () => Promise<void>;
}

export const createScoringSlice: StateCreator<GameState, [], [], ScoringSlice> = (set, get) => ({
  ranking: [],
  rankingMeta: null,
  roundScores: [],

  fetchRanking: async () => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return;
    try {
      const data = await _gameService.fetchRanking(_token);
      set({
        ranking: data.ranking,
        rankingMeta: { gameStatus: data.gameStatus, winner: data.winner, round: data.round },
      });
    } catch {
      // Ranking is optional — don't break the UI
    }
  },

  fetchRoundScores: async () => {
    const { _gameService, _token } = get();
    if (!_gameService || !_token) return;
    try {
      const data = await _gameService.fetchRoundScores(_token);
      set({ roundScores: data.scores });
    } catch {
      // Scores are optional — don't break the UI
    }
  },
});

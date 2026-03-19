import { useGameStore } from "@/features/game/store/gameStore";
import type { GamePhase } from "@/db";

interface CurrentPhaseResult {
  phase: GamePhase | undefined;
  isLobby: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  round: number | undefined;
  gameStatus: string | undefined;
}

export function useCurrentPhase(): CurrentPhaseResult {
  const game = useGameStore((s) => s.state?.game);

  return {
    phase: game?.phase,
    isLobby: game?.status === "lobby",
    isPlaying: game?.status === "playing",
    isFinished: game?.status === "finished",
    round: game?.round,
    gameStatus: game?.status,
  };
}

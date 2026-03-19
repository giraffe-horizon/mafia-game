import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import type { GameStateResponse } from "@/db";

interface PlayerStateResult {
  isHost: boolean;
  currentPlayer: GameStateResponse["currentPlayer"] | undefined;
  players: GameStateResponse["players"];
  nonHostPlayers: GameStateResponse["players"];
}

export function usePlayerState(): PlayerStateResult {
  const currentPlayer = useGameStore((s) => s.state?.currentPlayer);
  const players = useGameStore((s) => s.state?.players) ?? [];

  return {
    isHost: currentPlayer?.isHost ?? false,
    currentPlayer,
    players,
    nonHostPlayers: players.filter((p) => !p.isHost),
  };
}

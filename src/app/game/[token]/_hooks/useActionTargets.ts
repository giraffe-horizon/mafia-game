import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import type { GameStateResponse } from "@/db";

export function useActionTargets(roleVisible: boolean): GameStateResponse["players"] {
  const players = useGameStore((s) => s.state?.players);
  const currentRole = useGameStore((s) => s.state?.currentPlayer?.role);

  if (!players) return [];

  return players.filter(
    (p) =>
      p.isAlive &&
      !p.isYou &&
      !p.isHost &&
      !(roleVisible && currentRole === "mafia" && p.role === "mafia")
  );
}

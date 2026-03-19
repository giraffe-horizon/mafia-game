"use client";

import { useGameStore } from "@/stores/game/gameStore";
import { usePlayerState } from "@/hooks/game/usePlayerState";
import { useRoleVisibility } from "@/hooks/game/useRoleVisibility";
import DayView from "@/components/game/DayView";

export default function DayContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { roleVisible, setRoleVisible } = useRoleVisibility();
  const phase = useGameStore((s) => s.state?.game.phase);
  const detectiveResult = useGameStore((s) => s.state?.detectiveResult);

  if (!currentPlayer || !phase) return null;

  return (
    <DayView
      isHost={isHost}
      currentPlayer={currentPlayer}
      players={players}
      phase={phase}
      roleVisible={roleVisible}
      setRoleVisible={setRoleVisible}
      detectiveResult={detectiveResult}
    />
  );
}

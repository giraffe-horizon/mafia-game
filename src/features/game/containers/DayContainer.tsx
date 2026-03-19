"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useRoleVisibility } from "@/features/game/hooks/useRoleVisibility";
import DayView from "@/features/game/components/phases/DayView";

export default function DayContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { roleVisible, toggleRole } = useRoleVisibility();
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
      toggleRole={toggleRole}
      detectiveResult={detectiveResult}
    />
  );
}

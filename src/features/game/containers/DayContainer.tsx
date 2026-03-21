"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useRoleVisibility } from "@/features/game/hooks/useRoleVisibility";
import DayView from "@/features/game/components/phases/DayView";

export default function DayContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { roleVisible, toggleRole } = useRoleVisibility();
  const phase = useGameStore((s) => s.state?.game.phase);
  const round = useGameStore((s) => s.state?.game.round ?? 1);
  const detectiveResult = useGameStore((s) => s.state?.detectiveResult);
  const lastNightSummary = useGameStore((s) => s.state?.lastNightSummary);

  if (!currentPlayer || !phase) return null;

  return (
    <DayView
      isHost={isHost}
      currentPlayer={currentPlayer}
      players={players}
      phase={phase}
      round={round}
      roleVisible={roleVisible}
      toggleRole={toggleRole}
      detectiveResult={detectiveResult}
      lastNightSummary={lastNightSummary}
    />
  );
}

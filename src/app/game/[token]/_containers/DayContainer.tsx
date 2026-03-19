"use client";

import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import { useRoleVisibility } from "@/app/game/[token]/_hooks/useRoleVisibility";
import DayView from "@/app/game/[token]/_components/DayView";

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

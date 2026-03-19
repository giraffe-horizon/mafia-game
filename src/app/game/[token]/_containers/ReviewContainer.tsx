"use client";

import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import { useMissionForm } from "@/app/game/[token]/_hooks/useMissionForm";
import { createHttpGameService } from "@/app/game/[token]/_services/gameService";
import { useParams } from "next/navigation";
import ReviewView from "@/app/game/[token]/_components/ReviewView";

const gameService = createHttpGameService();

export default function ReviewContainer() {
  const { token } = useParams<{ token: string }>();
  const { isHost } = usePlayerState();
  const showPoints = useGameStore((s) => s.state?.showPoints ?? false);
  const hostMissions = useGameStore((s) => s.state?.hostMissions);
  const finalizeGame = useGameStore((s) => s.finalizeGame);
  const refetch = useGameStore((s) => s.refetch);

  const { handleCompleteMission, handleDeleteMission } = useMissionForm({
    token,
    refetch,
    gameService,
  });

  return (
    <ReviewView
      isHost={isHost}
      showPoints={showPoints}
      hostMissions={hostMissions}
      onComplete={handleCompleteMission}
      onDelete={handleDeleteMission}
      onFinalize={finalizeGame}
    />
  );
}

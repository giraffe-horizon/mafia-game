"use client";

import { useGameStore } from "@/stores/game/gameStore";
import { usePlayerState } from "@/hooks/game/usePlayerState";
import { useMissionForm } from "@/hooks/game/useMissionForm";
import { createHttpGameService } from "@/services/game/gameService";
import { useParams } from "next/navigation";
import ReviewView from "@/components/game/ReviewView";

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

"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useMissionForm } from "@/features/game/hooks/useMissionForm";
import { createHttpGameService } from "@/features/game/service";
import { useParams } from "next/navigation";
import ReviewView from "@/features/game/components/phases/ReviewView";

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

"use client";

import { useGameStore } from "@/stores/game/gameStore";
import { usePlayerState } from "@/hooks/game/usePlayerState";
import { useCurrentPhase } from "@/hooks/game/useCurrentPhase";
import { useRoleVisibility } from "@/hooks/game/useRoleVisibility";
import PlayersList from "@/components/game/PlayersList";

export default function PlayersListContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { isPlaying, isFinished, isLobby } = useCurrentPhase();
  const { roleVisible } = useRoleVisibility();
  const kickPlayer = useGameStore((s) => s.kickPlayer);
  const investigatedPlayers = useGameStore((s) => s.state?.investigatedPlayers);

  return (
    <PlayersList
      players={players}
      isPlaying={isPlaying}
      isFinished={isFinished}
      isLobby={isLobby}
      isHost={isHost}
      currentPlayerRole={currentPlayer?.role || undefined}
      roleVisible={roleVisible}
      onKick={(playerId: string) => kickPlayer(playerId)}
      investigatedPlayers={investigatedPlayers}
    />
  );
}

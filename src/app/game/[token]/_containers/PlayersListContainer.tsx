"use client";

import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import { useCurrentPhase } from "@/app/game/[token]/_hooks/useCurrentPhase";
import { useRoleVisibility } from "@/app/game/[token]/_hooks/useRoleVisibility";
import PlayersList from "@/app/game/[token]/_components/PlayersList";

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

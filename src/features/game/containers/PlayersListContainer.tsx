"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { useRoleVisibility } from "@/features/game/hooks/useRoleVisibility";
import PlayersList from "@/features/game/components/players/PlayersList";

export default function PlayersListContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { isPlaying, isFinished, isLobby, phase } = useCurrentPhase();
  const { roleVisible } = useRoleVisibility();
  const kickPlayer = useGameStore((s) => s.kickPlayer);
  const investigatedPlayersRaw = useGameStore((s) => s.state?.investigatedPlayers);

  // Detective sees investigation results only after the night phase ends
  const investigatedPlayers = phase !== "night" ? investigatedPlayersRaw : undefined;

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

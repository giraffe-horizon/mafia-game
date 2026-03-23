"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { useRoleVisibility } from "@/features/game/hooks/useRoleVisibility";
import { MIN_PLAYERS_FULL, MIN_PLAYERS_SIMPLE } from "@/lib/constants";
import PlayersList from "@/features/game/components/players/PlayersList";

export default function PlayersListContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { isPlaying, isFinished, isLobby } = useCurrentPhase();
  const { roleVisible } = useRoleVisibility();
  const kickPlayer = useGameStore((s) => s.kickPlayer);
  const transferGameMaster = useGameStore((s) => s.transferGameMaster);
  const investigatedPlayersRaw = useGameStore((s) => s.state?.investigatedPlayers);
  const gameMode = useGameStore((s) => s.state?.lobbySettings?.mode || "full");

  // Calculate minimum players based on game mode
  const minPlayers = gameMode === "full" ? MIN_PLAYERS_FULL : MIN_PLAYERS_SIMPLE;

  // Detective sees investigation markers only when role is revealed
  // (API already filters out current night's investigation during night phase)
  const investigatedPlayers = roleVisible ? investigatedPlayersRaw : undefined;

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
      onTransferGm={
        isLobby && isHost ? (playerId: string) => transferGameMaster(playerId) : undefined
      }
      investigatedPlayers={investigatedPlayers}
      minPlayers={minPlayers}
    />
  );
}

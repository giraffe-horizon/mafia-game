import type { PublicPlayer } from "@/db";
import PlayerRow from "@/features/game/components/players/PlayerRow";
import { SectionHeader } from "@/components/ui";

interface PlayersListProps {
  players: PublicPlayer[];
  isPlaying: boolean;
  isFinished: boolean;
  isLobby: boolean;
  isHost: boolean;
  currentPlayerRole?: string;
  roleVisible: boolean;
  onKick?: (playerId: string) => void;
  investigatedPlayers?: { playerId: string; isMafia: boolean }[];
}

export default function PlayersList({
  players,
  isPlaying,
  isFinished,
  isLobby,
  isHost,
  currentPlayerRole,
  roleVisible,
  onKick,
  investigatedPlayers,
}: PlayersListProps) {
  const investigatedMap = investigatedPlayers
    ? new Map(investigatedPlayers.map((ip) => [ip.playerId, ip.isMafia]))
    : null;

  return (
    <div className="mx-5 mt-5">
      <SectionHeader className="mb-3 pl-1">Gracze ({players.length})</SectionHeader>
      <div className="flex flex-col gap-2">
        {players.map((p) => (
          <PlayerRow
            key={p.playerId}
            player={p}
            isGamePlaying={isPlaying || isFinished}
            isFinished={isFinished}
            isLobby={isLobby}
            isHost={isHost}
            currentPlayerRole={currentPlayerRole}
            roleVisible={roleVisible}
            onKick={isLobby && isHost ? onKick : undefined}
            onRename={undefined}
            investigated={
              investigatedMap?.has(p.playerId) ? investigatedMap.get(p.playerId)! : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

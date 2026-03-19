import type { PublicPlayer } from "@/db";
import PlayerRow from "@/features/game/components/players/PlayerRow";

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

  const nonHostPlayers = players.filter((p) => !p.isHost);

  return (
    <div className="border-t border-surface-highest mt-4">
      {/* Header */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-surface-highest/40">
        <span className="material-symbols-outlined text-[14px] text-on-surface/30">group</span>
        <span className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/30">
          Lista obecności agentów ({nonHostPlayers.length})
        </span>
      </div>
      {/* Rows */}
      <div className="flex flex-col">
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

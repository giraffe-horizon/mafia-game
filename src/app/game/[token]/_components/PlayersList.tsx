import type { PublicPlayer } from "@/db";
import PlayerRow from "./PlayerRow";

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

  const aliveCount = players.filter((p) => !p.isHost && p.isAlive).length;
  const totalCount = players.filter((p) => !p.isHost).length;

  return (
    <div className="mx-5 mt-5">
      {/* LISTA OBECNOŚCI AGENTÓW header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface/30">group</span>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
            Lista obecności agentów
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isPlaying && aliveCount < totalCount && (
            <span className="font-display text-[10px] text-on-surface/25">
              {aliveCount}/{totalCount}
            </span>
          )}
          <span className="border border-on-surface/20 px-2 py-0.5 font-display font-bold text-[10px] text-on-surface/40">
            {players.length}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
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
              roleVisible && investigatedMap?.has(p.playerId)
                ? investigatedMap.get(p.playerId)!
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

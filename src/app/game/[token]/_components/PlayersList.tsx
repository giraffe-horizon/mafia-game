import PlayerRow from "./PlayerRow";

interface PlayersListProps {
  players: Array<any>;
  isPlaying: boolean;
  isFinished: boolean;
  isLobby: boolean;
  isHost: boolean;
  currentPlayerRole?: string;
  roleVisible: boolean;
  onKick?: (playerId: string) => void;
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
}: PlayersListProps) {
  return (
    <div className="mx-5 mt-5">
      <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">
        Gracze ({players.length})
      </p>
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
          />
        ))}
      </div>
    </div>
  );
}

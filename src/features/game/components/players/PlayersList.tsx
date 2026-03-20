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
  minPlayers?: number;
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
  minPlayers = 5,
}: PlayersListProps) {
  const investigatedMap = investigatedPlayers
    ? new Map(investigatedPlayers.map((ip) => [ip.playerId, ip.isMafia]))
    : null;

  const nonHostPlayers = players.filter((p) => !p.isHost);

  return (
    <div className="border-t border-surface-highest mt-4">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-surface-highest/40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface/50">group</span>
          <span className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/50">
            LISTA OBECNOŚCI AGENTÓW
          </span>
        </div>
        <span className="font-display font-black text-[10px] text-stamp/60 border border-stamp/30 px-1.5 py-0.5">
          {nonHostPlayers.length}
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
        {/* Ghost slots - show maximum 3 placeholders, rest as text */}
        {isLobby &&
          nonHostPlayers.length < minPlayers &&
          (() => {
            const missingPlayers = minPlayers - nonHostPlayers.length;
            const ghostSlotsToShow = Math.min(3, missingPlayers);
            const remainingPlayers = missingPlayers - ghostSlotsToShow;

            return (
              <>
                {Array.from({ length: ghostSlotsToShow }, (_, i) => (
                  <div
                    key={`ghost-${i}`}
                    className="flex items-center gap-3 px-3 py-2 border-b border-dashed border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.2)]"
                  >
                    <div className="w-0.5 self-stretch flex-shrink-0 bg-[rgba(255,255,255,0.15)]" />
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span className="font-display text-[10px] uppercase tracking-widest">
                      CZEKANIE NA AGENTA...
                    </span>
                  </div>
                ))}
                {remainingPlayers > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-dashed border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.2)]">
                    <div className="w-0.5 self-stretch flex-shrink-0 bg-[rgba(255,255,255,0.15)]" />
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                    <span className="font-display text-[10px] uppercase tracking-widest">
                      ...i {remainingPlayers} więcej
                    </span>
                  </div>
                )}
              </>
            );
          })()}
      </div>
    </div>
  );
}

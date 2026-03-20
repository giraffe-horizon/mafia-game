import type {
  VotingPlayerState as PlayerState,
  VotingViewState,
  VoteState,
} from "@/features/game/types";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import VotePanel from "@/features/game/components/VotePanel";
import RoleCard from "@/features/game/components/shared/RoleCard";
import PhaseIndicator from "@/features/game/components/shared/PhaseIndicator";

export type { PlayerState, VotingViewState, VoteState };

interface VotingViewProps {
  isHost: boolean;
  currentPlayer: PlayerState;
  viewState: VotingViewState;
  voteState: VoteState;
}

export default function VotingView({
  isHost,
  currentPlayer,
  viewState,
  voteState,
}: VotingViewProps) {
  const { roleVisible, toggleRole, phase } = viewState;
  const { players, myAction, actionPending, actionError, setChangingDecision, onVote, voteTally } =
    voteState;
  return (
    <div className="bg-background">
      {/* Role card for non-host players */}
      {!isHost && (
        <RoleCard role={currentPlayer.role} roleVisible={roleVisible} onToggle={toggleRole} />
      )}

      {/* Phase indicator for host */}
      {isHost && <PhaseIndicator phase={phase} />}

      {/* Vote panel for alive non-host players */}
      {!isHost && currentPlayer.isAlive && (
        <VotePanel
          targets={players.filter((p) => p.isAlive && !p.isYou && !p.isHost)}
          myAction={myAction}
          pending={actionPending}
          error={actionError}
          onVote={(targetId) => {
            setChangingDecision(false);
            onVote(targetId);
          }}
          onChangeDecision={() => setChangingDecision(true)}
        />
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView currentPlayer={currentPlayer} players={players} />
      )}

      {/* Vote tally — dossier style */}
      {voteTally && (
        <div className="mx-4 mt-4 border border-on-surface/30 bg-surface-low">
          <div className="border-b border-on-surface/20 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-on-surface/40">
                how_to_vote
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                Głosy na żywo
              </span>
            </div>
            <span className="font-display text-[10px] text-on-surface/40 uppercase tracking-widest">
              {voteTally.votedCount}/{voteTally.totalVoters}
            </span>
          </div>
          {voteTally.results.length > 0 ? (
            <div className="p-3 flex flex-col gap-2">
              {voteTally.results.map((r, i) => (
                <div key={r.playerId} className="flex items-center gap-3">
                  <span
                    className={`font-display text-sm flex-1 uppercase tracking-wide ${i === 0 ? "text-primary font-black" : "text-on-surface/70"}`}
                  >
                    {r.nickname}
                  </span>
                  <div className="w-24 h-1.5 bg-surface-highest/40">
                    <div
                      className={`h-full ${i === 0 ? "bg-primary" : "bg-on-surface/30"}`}
                      style={{ width: `${(r.votes / voteTally.totalVoters) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`font-display font-bold text-xs min-w-[1.5rem] text-right ${i === 0 ? "text-primary" : "text-on-surface/40"}`}
                  >
                    {r.votes}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-display text-on-surface/30 text-xs text-center p-4 uppercase tracking-widest">
              Nikt jeszcze nie zagłosował
            </p>
          )}
        </div>
      )}
    </div>
  );
}

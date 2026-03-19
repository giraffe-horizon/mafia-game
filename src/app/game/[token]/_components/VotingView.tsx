import { SectionHeader } from "@/components/ui";
import type {
  VotingPlayerState as PlayerState,
  VotingViewState,
  VoteState,
} from "@/app/game/[token]/_types";
import DeadSpectatorView from "@/app/game/[token]/_components/DeadSpectatorView";
import VotePanel from "@/app/game/[token]/_components/VotePanel";
import RoleCard from "@/app/game/[token]/_components/RoleCard";
import PhaseIndicator from "@/app/game/[token]/_components/PhaseIndicator";

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
  const { roleVisible, setRoleVisible, phase } = viewState;
  const { players, myAction, actionPending, actionError, setChangingDecision, onVote, voteTally } =
    voteState;
  return (
    <>
      {/* Role card for non-host players */}
      {!isHost && (
        <RoleCard
          role={currentPlayer.role}
          roleVisible={roleVisible}
          onToggle={() => setRoleVisible((v) => !v)}
        />
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

      {/* Vote tally */}
      {voteTally && (
        <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader icon="how_to_vote" className="text-slate-400 mb-0">
              Głosy na żywo
            </SectionHeader>
            <span className="text-slate-500 text-xs font-typewriter">
              {voteTally.votedCount}/{voteTally.totalVoters} oddanych
            </span>
          </div>
          {voteTally.results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {voteTally.results.map((r, i) => (
                <div key={r.playerId} className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium flex-1">{r.nickname}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${i === 0 ? "bg-primary" : "bg-slate-600"}`}
                      style={{ width: `${(r.votes / voteTally.totalVoters) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold font-typewriter min-w-[2rem] text-right ${i === 0 ? "text-primary" : "text-slate-500"}`}
                  >
                    {r.votes}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-xs font-typewriter text-center">
              Nikt jeszcze nie zagłosował
            </p>
          )}
        </div>
      )}
    </>
  );
}

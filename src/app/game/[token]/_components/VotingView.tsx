import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";
import type { PublicPlayer } from "@/db/types";
import { SectionHeader, Card } from "@/components/ui";
import VotePanel from "./VotePanel";

interface VoteTally {
  votedCount: number;
  totalVoters: number;
  results: Array<{
    playerId: string;
    nickname: string;
    votes: number;
  }>;
}

export interface PlayerState {
  isAlive: boolean;
  role?: string;
}

export interface VotingViewState {
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  phase: string;
}

export interface VoteState {
  players: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  actionPending: boolean;
  actionError: string;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;
  onVote: (targetId: string) => void;
  voteTally?: VoteTally;
}

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
        <div className="mx-5 mt-5">
          <SectionHeader className="pl-1">Twoja rola</SectionHeader>
          <Card
            variant="highlighted"
            onClick={() => setRoleVisible((v) => !v)}
            className="w-full p-5 cursor-pointer transition-all active:scale-[0.98]"
            role="button"
            tabIndex={0}
            aria-label={roleVisible ? "Ukryj rolę" : "Pokaż rolę"}
          >
            {roleVisible ? (
              <div className="flex items-center gap-4">
                <span
                  className={`material-symbols-outlined text-[48px] ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                >
                  {ROLE_ICONS[currentPlayer.role ?? "civilian"]}
                </span>
                <div className="text-left">
                  <p
                    className={`font-typewriter text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                  >
                    {ROLE_LABELS[currentPlayer.role ?? "civilian"]}
                  </p>
                  {currentPlayer.role === "mafia" && (
                    <p className="text-red-400/70 text-xs font-typewriter mt-1">
                      🔴 Twoi wspólnicy są oznaczeni na liście
                    </p>
                  )}
                  <p className="text-slate-500 text-sm mt-1">Stuknij aby ukryć</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2">
                <span className="material-symbols-outlined text-[32px] text-slate-600">
                  visibility_off
                </span>
                <p className="font-typewriter text-slate-500 uppercase tracking-widest text-sm">
                  Stuknij aby zobaczyć rolę
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Phase indicator for host */}
      {isHost && (
        <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-slate-700 flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">
            {PHASE_ICONS[phase]}
          </span>
          <div>
            <SectionHeader className="mb-0">Faza gry</SectionHeader>
            <p className="font-typewriter text-xl font-bold text-white uppercase tracking-wider">
              {PHASE_LABELS[phase]}
            </p>
          </div>
        </div>
      )}

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

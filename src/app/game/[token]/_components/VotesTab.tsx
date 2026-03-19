"use client";

import { useGameStore } from "../_stores/gameStore";
import VotePanel from "./VotePanel";
import DeadSpectatorView from "./DeadSpectatorView";
import { SectionHeader, InfoCard } from "@/components/ui";

interface VotesTabProps {
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  actionPending: boolean;
  actionError: string;
  onVote: (targetId: string) => void;
  onChangeDecision: () => void;
}

export default function VotesTab({
  myAction,
  actionPending,
  actionError,
  onVote,
  onChangeDecision,
}: VotesTabProps) {
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const { game, currentPlayer, players, voteTally, voteHistory } = state;
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const phase = game.phase;

  // Lobby
  if (isLobby) {
    return (
      <div className="mx-5 mt-12 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-[52px] text-on-surface/15">
          how_to_vote
        </span>
        <p className="text-on-surface/35 font-display font-bold uppercase tracking-widest text-sm">
          Głosowanie niedostępne
        </p>
        <p className="text-on-surface/20 text-xs font-display">
          Głosowanie będzie dostępne po rozpoczęciu gry
        </p>
      </div>
    );
  }

  // Voting phase
  if (phase === "voting") {
    return (
      <>
        {/* Role card + vote panel for alive non-host */}
        {!isHost && currentPlayer.isAlive && (
          <VotePanel
            targets={players.filter((p) => p.isAlive && !p.isYou && !p.isHost)}
            myAction={myAction}
            pending={actionPending}
            error={actionError}
            onVote={(targetId) => {
              onVote(targetId);
            }}
            onChangeDecision={onChangeDecision}
          />
        )}

        {/* Dead spectator */}
        {!isHost && !currentPlayer.isAlive && (
          <DeadSpectatorView
            currentPlayer={{ role: currentPlayer.role || undefined }}
            players={players}
          />
        )}

        {/* Host: voting in progress info */}
        {isHost && (
          <InfoCard
            icon="how_to_vote"
            title="Głosowanie w toku"
            description="Gracze oddają głosy"
            className="mx-5 mt-5"
          />
        )}

        {/* Live vote tally */}
        {voteTally && (
          <div className="mx-5 mt-4 border border-on-surface/10 bg-surface-low p-4">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader icon="how_to_vote" className="mb-0">
                Głosy na żywo
              </SectionHeader>
              <span className="text-on-surface/35 text-xs font-display">
                {voteTally.votedCount}/{voteTally.totalVoters} oddanych
              </span>
            </div>
            {voteTally.results.length > 0 ? (
              <div className="flex flex-col gap-2">
                {voteTally.results.map((r, i) => (
                  <div key={r.playerId} className="flex items-center gap-3">
                    <span className="text-on-surface text-sm font-display flex-1">
                      {r.nickname}
                    </span>
                    <div className="flex-1 h-1.5 bg-surface-highest overflow-hidden">
                      <div
                        className={`h-full ${i === 0 ? "bg-stamp" : "bg-on-surface/30"}`}
                        style={{ width: `${(r.votes / voteTally.totalVoters) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold font-display min-w-[2rem] text-right ${i === 0 ? "text-stamp" : "text-on-surface/40"}`}
                    >
                      {r.votes}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface/25 text-xs font-display text-center">
                Nikt jeszcze nie zagłosował
              </p>
            )}
          </div>
        )}
      </>
    );
  }

  // Other phases: vote history from previous rounds
  const hasHistory = voteHistory && voteHistory.length > 0;

  return (
    <div className="mx-5 mt-5">
      {hasHistory ? (
        <>
          <SectionHeader className="mb-3 pl-1">Historia głosowań</SectionHeader>
          <div className="flex flex-col gap-4">
            {[...voteHistory].reverse().map((round) => (
              <div key={round.round} className="border border-on-surface/10 bg-surface-low p-4">
                <p className="text-on-surface/35 font-display font-bold uppercase tracking-widest text-[10px] mb-3">
                  Runda {round.round}
                </p>
                {round.results.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {round.results.map((r) => (
                      <div key={r.playerId} className="flex items-center gap-3">
                        <span
                          className={`text-sm font-display flex-1 ${r.eliminated ? "text-stamp font-bold" : "text-on-surface"}`}
                        >
                          {r.nickname}
                          {r.eliminated && (
                            <span className="text-[10px] ml-2 text-stamp/70 font-display uppercase tracking-wider">
                              — wyeliminowany
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-sm font-bold font-display ${r.eliminated ? "text-stamp" : "text-on-surface/40"}`}
                        >
                          {r.votes}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-on-surface/25 text-xs font-display">
                    Brak głosów w tej rundzie
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface/15">
            how_to_vote
          </span>
          <p className="text-on-surface/30 font-display uppercase tracking-widest text-xs">
            Brak historii głosowań
          </p>
        </div>
      )}
    </div>
  );
}

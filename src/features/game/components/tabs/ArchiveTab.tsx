"use client";

import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { useGameStore } from "@/features/game/store/gameStore";
import VotingContainer from "@/features/game/containers/VotingContainer";
import RankingInline from "@/features/game/components/shared/RankingInline";
import { Stamp } from "@/components/ui";

export default function ArchiveTab() {
  const { phase, isLobby } = useCurrentPhase();
  const voteHistory = useGameStore((s) => s.state?.voteHistory);
  const gameLog = useGameStore((s) => s.state?.gameLog);

  if (isLobby) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <span className="material-symbols-outlined text-[48px] text-on-surface/40">
          folder_open
        </span>
        <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
          Archiwum będzie dostępne po rozpoczęciu gry
        </p>
      </div>
    );
  }

  const hasVoteHistory = voteHistory && voteHistory.length > 0;
  const hasGameLog = gameLog && gameLog.length > 0;
  const hasContent = hasVoteHistory || hasGameLog;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">folder_open</span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
          Archiwum
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Active voting during voting phase */}
        {phase === "voting" && (
          <div className="bg-gradient-to-b from-background via-background to-pink-950/10">
            <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">
                how_to_vote
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                Głosowanie
              </span>
              <div className="ml-auto">
                <Stamp
                  variant="classified"
                  color="red"
                  rotate={8}
                  className="text-[8px] px-1.5 py-0.5"
                >
                  AKTYWNE
                </Stamp>
              </div>
            </div>
            <VotingContainer />
          </div>
        )}

        {/* Vote history */}
        {hasVoteHistory && (
          <div className="border-b border-surface-highest">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface/40">
                how_to_vote
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                Historia głosowań
              </span>
            </div>
            <div className="p-4 pt-0 flex flex-col gap-4">
              {voteHistory.map((roundVote) => (
                <div key={roundVote.round} className="border border-surface-highest">
                  <div className="bg-surface-highest/20 px-3 py-2 flex items-center gap-2">
                    <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                      Runda {roundVote.round}
                    </span>
                    {roundVote.results.some((r) => r.eliminated) && (
                      <Stamp color="red" rotate={0} className="ml-auto text-[9px]">
                        Eliminacja
                      </Stamp>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {roundVote.results.map((result) => (
                      <div
                        key={result.playerId}
                        className={`flex items-center gap-3 py-1.5 border-b border-surface-highest/40 last:border-0 ${result.eliminated ? "text-primary" : "text-on-surface/60"}`}
                      >
                        <span className="font-display font-black text-sm uppercase tracking-wide flex-1">
                          {result.nickname}
                        </span>
                        <span className="font-display text-xs text-on-surface/40">
                          {result.votes} {result.votes === 1 ? "głos" : "głosów"}
                        </span>
                        {result.eliminated && (
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            skull
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game log events (moved from AgentsTab) */}
        {hasGameLog && (
          <div className="border-b border-surface-highest">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface/40">
                history
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                Historia zdarzeń
              </span>
            </div>
            <div className="p-4 pt-0 flex flex-col gap-4">
              {gameLog.map((roundData) => (
                <div key={roundData.round} className="border border-surface-highest">
                  <div className="bg-surface-highest/20 px-3 py-2">
                    <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                      Runda {roundData.round}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {roundData.events.map((event, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="material-symbols-outlined text-[14px] text-on-surface/40 mt-0.5">
                          {event.type === "night_result" ? "bedtime" : "how_to_vote"}
                        </span>
                        <p className="font-display text-on-surface/70">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking inline (moved from AgentsTab) */}
        <div className="border-b border-surface-highest">
          <RankingInline />
        </div>

        {/* Empty state — only shown when no content at all */}
        {!hasContent && phase !== "voting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface/40">
              folder_open
            </span>
            <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
              Brak danych w archiwum
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

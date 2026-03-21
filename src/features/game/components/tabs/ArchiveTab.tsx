"use client";

import { useMemo } from "react";

import { Stamp } from "@/components/ui";
import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { useGameStore } from "@/features/game/store/gameStore";

interface MergedRound {
  round: number;
  events: { type: string; description: string; timestamp: string }[];
  voteResults: {
    playerId: string;
    nickname: string;
    votes: number;
    eliminated: boolean;
  }[];
  hasElimination: boolean;
}

export default function ArchiveTab() {
  const { isLobby } = useCurrentPhase();
  const voteHistory = useGameStore((s) => s.state?.voteHistory);
  const gameLog = useGameStore((s) => s.state?.gameLog);

  const mergedRounds = useMemo(() => {
    const roundMap = new Map<number, MergedRound>();

    const getOrCreate = (round: number): MergedRound => {
      let entry = roundMap.get(round);
      if (!entry) {
        entry = { round, events: [], voteResults: [], hasElimination: false };
        roundMap.set(round, entry);
      }
      return entry;
    };

    if (gameLog) {
      for (const roundData of gameLog) {
        const entry = getOrCreate(roundData.round);
        entry.events.push(...roundData.events);
      }
    }

    if (voteHistory) {
      for (const roundVote of voteHistory) {
        const entry = getOrCreate(roundVote.round);
        entry.voteResults.push(...roundVote.results);
        if (roundVote.results.some((r) => r.eliminated)) {
          entry.hasElimination = true;
        }
      }
    }

    return Array.from(roundMap.values()).sort((a, b) => a.round - b.round);
  }, [gameLog, voteHistory]);

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

  const hasContent = mergedRounds.length > 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">folder_open</span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
          Archiwum
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasContent && (
          <div className="p-4 flex flex-col gap-4">
            {mergedRounds.map((round) => (
              <div key={round.round} className="border border-surface-highest">
                {/* Round header */}
                <div className="bg-surface-highest/20 px-3 py-2 flex items-center gap-2">
                  <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                    Runda {round.round}
                  </span>
                  {round.hasElimination && (
                    <Stamp color="red" rotate={0} className="ml-auto text-[9px]">
                      Eliminacja
                    </Stamp>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-3">
                  {/* Night events */}
                  {round.events.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-on-surface/40">
                          bedtime
                        </span>
                        <span className="font-display text-[10px] uppercase tracking-widest text-on-surface/40">
                          Zdarzenia nocne
                        </span>
                      </div>
                      {round.events.map((event, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm pl-5">
                          <p className="font-display text-on-surface/70">{event.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vote results */}
                  {round.voteResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-on-surface/40">
                          how_to_vote
                        </span>
                        <span className="font-display text-[10px] uppercase tracking-widest text-on-surface/40">
                          Głosowanie
                        </span>
                      </div>
                      {round.voteResults.map((result) => (
                        <div
                          key={result.playerId}
                          className={`flex items-center gap-3 py-1.5 pl-5 border-b border-surface-highest/40 last:border-0 ${result.eliminated ? "text-primary" : "text-on-surface/60"}`}
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasContent && (
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

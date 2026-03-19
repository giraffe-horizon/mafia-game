"use client";

import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { useGameStore } from "@/features/game/store/gameStore";
import VotingContainer from "@/features/game/containers/VotingContainer";
import { Stamp } from "@/components/ui";

export default function VotesTab() {
  const { phase, isLobby } = useCurrentPhase();
  const voteHistory = useGameStore((s) => s.state?.voteHistory);

  if (isLobby) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <span className="material-symbols-outlined text-[48px] text-on-surface/20">
          how_to_vote
        </span>
        <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
          Głosowanie będzie dostępne po rozpoczęciu gry
        </p>
      </div>
    );
  }

  if (phase === "voting") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">how_to_vote</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Głosowanie
          </span>
        </div>
        <VotingContainer />
      </div>
    );
  }

  // Show vote history when not in voting phase
  if (voteHistory && voteHistory.length > 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-on-surface/40">
            how_to_vote
          </span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Historia głosowań
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
      <span className="material-symbols-outlined text-[48px] text-on-surface/20">how_to_vote</span>
      <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
        Brak historii głosowań
      </p>
    </div>
  );
}

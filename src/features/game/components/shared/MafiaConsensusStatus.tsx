"use client";

import type { GameStateResponse } from "@/db";

export default function MafiaConsensusStatus({
  mafiaTeamActions,
  currentNickname,
}: {
  mafiaTeamActions: NonNullable<GameStateResponse["mafiaTeamActions"]>;
  currentNickname?: string;
}) {
  const mafiaWithTargets = mafiaTeamActions.filter((a) => a.targetPlayerId);
  const targets = [...new Set(mafiaWithTargets.map((a) => a.targetPlayerId))];
  const allMafiaVoted = mafiaWithTargets.length === mafiaTeamActions.length;
  const totalMafia = mafiaTeamActions.length;
  const votedCount = mafiaWithTargets.length;

  return (
    <div className="space-y-3">
      {mafiaWithTargets.length > 0 && (
        <div className="p-3 bg-surface-lowest border border-red-900/40">
          <p className="text-on-surface-dim text-xs font-display font-bold uppercase tracking-widest mb-2">
            Głosy mafii
          </p>
          <div className="flex flex-col gap-1">
            {mafiaWithTargets.map((action) => (
              <div key={action.nickname} className="flex items-center gap-2 text-xs">
                <span className="text-stamp font-display font-bold">
                  {action.nickname}
                  {action.nickname === currentNickname ? " (Ty)" : ""}
                </span>
                <span className="material-symbols-outlined text-[12px] text-on-surface-dim">
                  arrow_forward
                </span>
                <span className="text-on-surface font-display">{action.targetNickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consensus status */}
      <div className="flex items-center gap-3 py-2 border-t border-surface-highest">
        <span className="font-display text-xs text-on-surface-dim uppercase tracking-widest">
          {votedCount}/{totalMafia} zagłosowało
        </span>
        {allMafiaVoted && targets.length === 1 && (
          <span className="font-display font-black text-xs text-stamp uppercase tracking-widest">
            — Konsensus!
          </span>
        )}
        {allMafiaVoted && targets.length > 1 && (
          <span className="font-display font-black text-xs text-on-surface-dim uppercase tracking-widest">
            — Brak konsensusu
          </span>
        )}
      </div>
    </div>
  );
}

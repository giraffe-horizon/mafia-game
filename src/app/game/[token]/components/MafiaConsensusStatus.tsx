"use client";

import type { GameStateResponse } from "@/lib/db";

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
      {/* Show individual votes if any exist */}
      {mafiaWithTargets.length > 0 && (
        <div className="p-3 bg-black/30 border border-slate-700 rounded-lg">
          <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-2">
            Głosy mafii
          </p>
          <div className="flex flex-col gap-1">
            {mafiaWithTargets.map((action, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="text-red-400 font-medium">
                  {action.nickname}
                  {action.nickname === currentNickname ? " (Ty)" : ""}
                </span>
                <span className="material-symbols-outlined text-[12px] text-slate-500">
                  arrow_forward
                </span>
                <span className="text-white">{action.targetNickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status message */}
      <div>
        {mafiaWithTargets.length > 0 && targets.length > 1 && (
          <div className="p-2 bg-red-900/30 border border-red-700/50 rounded-lg">
            <p className="text-red-400 text-xs font-typewriter">
              ⚠️ Mafia nie jest zgodna! Cel nie zostanie wyeliminowany.
            </p>
          </div>
        )}

        {allMafiaVoted && targets.length === 1 && targets[0] && (
          <div className="p-2 bg-green-900/30 border border-green-700/50 rounded-lg">
            <p className="text-green-400 text-xs font-typewriter">
              ✅ Mafia jest zgodna — cel:{" "}
              {mafiaTeamActions.find((a) => a.targetPlayerId === targets[0])?.targetNickname ??
                targets[0]}
            </p>
          </div>
        )}

        {!allMafiaVoted && (
          <div className="p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <p className="text-yellow-400 text-xs font-typewriter">
              ⏳ Czekam na {totalMafia - votedCount} graczy... ({votedCount}/{totalMafia})
            </p>
          </div>
        )}

        {mafiaWithTargets.length === 0 && (
          <div className="p-2 bg-slate-900/30 border border-slate-700/50 rounded-lg">
            <p className="text-slate-400 text-xs font-typewriter">Nikt jeszcze nie głosował...</p>
          </div>
        )}
      </div>
    </div>
  );
}

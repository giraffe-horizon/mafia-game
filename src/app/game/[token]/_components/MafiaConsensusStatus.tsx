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
  const isUnanimous = allMafiaVoted && targets.length === 1;

  return (
    <div className="flex flex-col gap-2">
      {/* Individual votes as dossier entries */}
      {mafiaWithTargets.length > 0 && (
        <div className="border border-on-surface/12 bg-background">
          <p className="px-3 py-2 font-display font-bold uppercase tracking-widest text-[9px] text-on-surface/30 border-b border-on-surface/8">
            Głosy operacyjne
          </p>
          <div className="flex flex-col">
            {mafiaWithTargets.map((action) => (
              <div
                key={action.nickname}
                className="flex items-center gap-2 px-3 py-2 border-b border-on-surface/6 last:border-0"
              >
                <span
                  className={`font-display text-xs font-bold ${
                    action.nickname === currentNickname ? "text-stamp" : "text-on-surface/60"
                  }`}
                >
                  {action.nickname}
                  {action.nickname === currentNickname ? " (Ty)" : ""}
                </span>
                <span className="material-symbols-outlined text-[10px] text-on-surface/25 mx-1">
                  arrow_forward
                </span>
                <span className="font-display text-on-surface text-xs">
                  {action.targetNickname}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status message */}
      <div
        className="border-l-2 pl-3 py-1 flex items-center gap-2 justify-between"
        style={{
          borderColor: isUnanimous ? "#4a8c4a" : !allMafiaVoted ? "#ffb4ac" : "#e07060",
        }}
      >
        <p className="font-display text-xs text-on-surface/50">
          {isUnanimous && targets[0]
            ? `Cel: ${mafiaTeamActions.find((a) => a.targetPlayerId === targets[0])?.targetNickname ?? targets[0]}`
            : !allMafiaVoted
              ? `Czekam na ${totalMafia - votedCount} z ${totalMafia} graczy`
              : "Mafia nie jest zgodna"}
        </p>
        {isUnanimous ? (
          <span className="stamp stamp-green text-[8px] py-0 px-1">ZGODNA</span>
        ) : (
          <span className="stamp stamp-red text-[8px] py-0 px-1">
            {allMafiaVoted ? "NIEZGODNA" : `${votedCount}/${totalMafia}`}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import type { GameStateResponse } from "@/lib/db";

export default function MafiaConsensusStatus({
  mafiaTeamActions,
}: {
  mafiaTeamActions: NonNullable<GameStateResponse["mafiaTeamActions"]>;
}) {
  const mafiaWithTargets = mafiaTeamActions.filter((a) => a.targetPlayerId);
  const targets = [...new Set(mafiaWithTargets.map((a) => a.targetPlayerId))];
  const allMafiaVoted = mafiaWithTargets.length === mafiaTeamActions.length;

  if (mafiaWithTargets.length > 0 && targets.length > 1) {
    return (
      <div className="p-2 bg-red-900/30 border border-red-700/50 rounded-lg">
        <p className="text-red-400 text-xs font-typewriter">
          ⚠️ Mafia nie jest zgodna! Cel nie zostanie wyeliminowany.
        </p>
      </div>
    );
  }

  if (allMafiaVoted && targets.length === 1 && targets[0]) {
    const targetNickname = mafiaTeamActions.find(
      (a) => a.targetPlayerId === targets[0]
    )?.targetNickname;
    return (
      <div className="p-2 bg-green-900/30 border border-green-700/50 rounded-lg">
        <p className="text-green-400 text-xs font-typewriter">
          ✅ Mafia jest zgodna — cel: {targetNickname ?? targets[0]}
        </p>
      </div>
    );
  }

  if (mafiaWithTargets.length > 0 && !allMafiaVoted) {
    return (
      <div className="p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
        <p className="text-yellow-400 text-xs font-typewriter">
          ⏳ Czekam na pozostałych członków mafii...
        </p>
      </div>
    );
  }

  return null;
}

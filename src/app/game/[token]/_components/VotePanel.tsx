"use client";

import type { PublicPlayer } from "@/lib/db";
import type { ActionType } from "@/db/types";

export default function VotePanel({
  targets,
  myAction,
  pending,
  error,
  onVote,
  onChangeDecision,
}: {
  targets: PublicPlayer[];
  myAction: { actionType: ActionType; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onVote: (targetId: string) => void;
  onChangeDecision: () => void;
}) {
  if (myAction) {
    const targetName =
      targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ??
      myAction.targetPlayerId;
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
        <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          Oskarżasz:
        </p>
        <p className="text-slate-300 text-sm">
          <span className="text-white font-medium">{targetName}</span>
        </p>
        <button
          onClick={() => onChangeDecision()}
          className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 font-typewriter uppercase tracking-wider text-xs transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          Zmień głos
        </button>
      </div>
    );
  }

  const alivePlayers = targets.filter((p) => p.isAlive);

  return (
    <div className="mx-5 mt-4">
      <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">how_to_vote</span>
        Kogo oskarżasz?
      </p>
      {error && <p className="text-red-400 text-xs font-typewriter mb-2 px-1">{error}</p>}
      <div className="flex flex-col gap-2">
        {alivePlayers.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => onVote(p.playerId)}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-black/30 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-40 text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
            <span className="text-white text-sm">{p.nickname}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

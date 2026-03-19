"use client";

import type { PublicPlayer } from "@/db";

export default function VotePanel({
  targets,
  myAction,
  pending,
  error,
  onVote,
  onChangeDecision,
}: {
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onVote: (targetId: string) => void;
  onChangeDecision: () => void;
}) {
  // ── Already voted ──────────────────────────────────────────────────────────
  if (myAction) {
    const targetName =
      targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ??
      myAction.targetPlayerId;

    return (
      <div className="mx-5 mt-4 border border-stamp/25 bg-stamp/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stamp/15">
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-stamp/70">
            Twój głos
          </p>
          <span className="stamp stamp-red text-[9px] py-0 px-1.5">OSKARŻONY</span>
        </div>
        <div className="px-4 py-3">
          <p className="font-display font-bold text-on-surface text-xl uppercase tracking-wider">
            {targetName}
          </p>
        </div>
        <div className="px-4 pb-3">
          <button
            onClick={() => onChangeDecision()}
            className="flex items-center gap-2 text-on-surface/40 hover:text-on-surface/70 font-display uppercase tracking-widest text-[10px]"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Zmień głos
          </button>
        </div>
      </div>
    );
  }

  // ── Choose target ──────────────────────────────────────────────────────────
  const alivePlayers = targets.filter((p) => p.isAlive);

  return (
    <div className="mx-5 mt-4 border border-on-surface/12 bg-surface-low">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-on-surface/8">
        <span className="material-symbols-outlined text-[16px] text-on-surface/40">
          how_to_vote
        </span>
        <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/40">
          Kogo oskarżasz?
        </p>
      </div>
      {error && <p className="text-stamp text-xs font-display px-4 pt-3">{error}</p>}
      <div className="flex flex-col">
        {alivePlayers.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => onVote(p.playerId)}
            className="flex items-center gap-3 px-4 py-3 border-b border-on-surface/6 last:border-0 hover:bg-stamp/5 hover:border-stamp/20 disabled:opacity-40 text-left group"
          >
            <span className="material-symbols-outlined text-[14px] text-on-surface/25 group-hover:text-stamp/50">
              person
            </span>
            <span className="font-display text-on-surface text-sm flex-1">{p.nickname}</span>
            <span className="stamp stamp-red text-[8px] py-0 px-1 opacity-0 group-hover:opacity-100">
              OSKARŻ
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

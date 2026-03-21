"use client";

import { useState } from "react";
import type { PublicPlayer } from "@/db";
import { Stamp, ConfirmDialog } from "@/components/ui";

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
  const [pendingVoteTarget, setPendingVoteTarget] = useState<PublicPlayer | null>(null);
  if (myAction) {
    const targetName =
      targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ??
      myAction.targetPlayerId;
    return (
      <div className="mx-4 mt-4 border border-primary/30 p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[24px] text-primary">how_to_vote</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Oskarżasz:
          </span>
        </div>
        <div className="relative flex justify-center py-4">
          <p className="font-display font-black text-xl text-on-surface uppercase tracking-widest">
            {targetName}
          </p>
          <div className="absolute -top-1 -right-1">
            <Stamp color="red" rotate={3}>
              OSKARŻONY
            </Stamp>
          </div>
        </div>
        <button
          onClick={onChangeDecision}
          className="mt-4 w-full border border-dashed border-on-surface/20 py-2 font-display font-black text-xs uppercase tracking-widest text-on-surface/40 hover:text-on-surface/60 hover:border-on-surface/40 transition-colors"
        >
          Zmień głos
        </button>
      </div>
    );
  }

  const alivePlayers = targets.filter((p) => p.isAlive);

  return (
    <div className="mx-4 mt-4 border border-surface-highest">
      <div className="border-b border-surface-highest px-3 py-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px] text-primary">how_to_vote</span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
          Kogo oskarżasz?
        </span>
      </div>
      {error && <p className="text-primary-dark text-xs font-display mx-3 mt-2">{error}</p>}
      <div className="p-3 flex flex-col gap-1.5">
        {alivePlayers.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => setPendingVoteTarget(p)}
            className="flex items-center gap-3 p-3 border border-surface-highest hover:border-primary/60 hover:bg-primary/5 active:opacity-70 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface/50">person</span>
            <span className="font-display text-sm text-on-surface flex-1 uppercase tracking-wide">
              {p.nickname}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface/30">
              chevron_right
            </span>
          </button>
        ))}
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={!!pendingVoteTarget}
        onClose={() => setPendingVoteTarget(null)}
        onConfirm={() => {
          if (pendingVoteTarget) {
            onVote(pendingVoteTarget.playerId);
          }
        }}
        title="POTWIERDŹ OSKARŻENIE"
        message={`Czy na pewno chcesz oskarżyć ${pendingVoteTarget?.nickname}? To będzie twój ostateczny głos w tej rundzie.`}
        confirmText="OSKARŻAM"
        cancelText="ANULUJ"
        variant="danger"
      />
    </div>
  );
}

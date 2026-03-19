"use client";

import type { PublicPlayer } from "@/db";
import { SectionHeader } from "@/components/ui";
import ActionConfirmation from "@/components/game/ActionConfirmation";

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
  if (myAction) {
    const targetName =
      targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ??
      myAction.targetPlayerId;
    return (
      <ActionConfirmation
        label="Oskarżasz:"
        targetName={targetName ?? ""}
        onChangeDecision={onChangeDecision}
      />
    );
  }

  const alivePlayers = targets.filter((p) => p.isAlive);

  return (
    <div className="mx-5 mt-4">
      <SectionHeader icon="how_to_vote" className="text-slate-400 mb-3 pl-1">
        Kogo oskarżasz?
      </SectionHeader>
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

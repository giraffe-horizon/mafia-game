"use client";

import type { PublicPlayer } from "@/db";
import type { Role, ActionType } from "@/db/types";
import type { ActionState, MafiaState } from "@/features/game/types";
import { ACTION_CONFIRMED } from "@/lib/constants";
import { cn } from "@/lib/cn";
import MafiaConsensusStatus from "@/features/game/components/shared/MafiaConsensusStatus";
import ActionConfirmation from "@/features/game/components/shared/ActionConfirmation";
import { Button, Stamp } from "@/components/ui";

interface NightActionPanelProps {
  role: Role | null;
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  roleHidden?: boolean;
  actionState: ActionState;
  mafiaState: MafiaState;
  doctorLastTargetId?: string;
  investigatedPlayerIds?: string[];
}

const roleConfig: Record<
  Role,
  { type: ActionType; label: string; icon: string; tint: string; borderColor: string }
> = {
  mafia: {
    type: "kill",
    label: "Wytypuj ofiarę nocy",
    icon: "skull",
    tint: "bg-red-950/20",
    borderColor: "border-red-900/40",
  },
  detective: {
    type: "investigate",
    label: "Kogo przesłuchać?",
    icon: "search",
    tint: "bg-blue-950/20",
    borderColor: "border-blue-900/40",
  },
  doctor: {
    type: "protect",
    label: "Kogo chronić tej nocy?",
    icon: "medical_services",
    tint: "bg-green-950/20",
    borderColor: "border-green-900/40",
  },
  civilian: {
    type: "wait",
    label: "Czekasz w ukryciu...",
    icon: "visibility_off",
    tint: "bg-surface-highest/10",
    borderColor: "border-surface-highest/40",
  },
};

export default function NightActionPanel({
  role,
  targets,
  myAction,
  roleHidden = false,
  actionState,
  mafiaState,
  doctorLastTargetId,
  investigatedPlayerIds,
}: NightActionPanelProps) {
  const { pending, error, onAction, onChangeDecision } = actionState;
  const { teamActions: mafiaTeamActions, currentNickname } = mafiaState;

  if (myAction) {
    if (role === "mafia" && !roleHidden && mafiaTeamActions) {
      return (
        <div className="mx-4 mt-4">
          <div className="border border-red-900/40 bg-red-950/10">
            <div className="border-b border-red-900/40 px-3 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-primary-dark">skull</span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-primary-dark">
                Status głosowania mafii
              </span>
            </div>
            <div className="p-3">
              <MafiaConsensusStatus
                mafiaTeamActions={mafiaTeamActions}
                currentNickname={currentNickname}
              />
              <Button
                onClick={() => onChangeDecision()}
                variant="ghost"
                size="sm"
                icon="edit"
                className="mt-3 w-full"
              >
                Zmień głos
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const targetName =
      targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ??
      myAction.targetPlayerId;
    const actionLabel = roleHidden
      ? "Akcja wykonana"
      : (ACTION_CONFIRMED[myAction.actionType] ?? "Akcja wykonana");
    return (
      <ActionConfirmation
        label={actionLabel}
        targetName={myAction.targetPlayerId && !roleHidden ? (targetName ?? "") : ""}
        onChangeDecision={onChangeDecision}
      >
        {roleHidden && (
          <p className="text-on-surface/40 text-xs mt-1 font-display">
            Odkryj rolę by zobaczyć szczegóły
          </p>
        )}
      </ActionConfirmation>
    );
  }

  const action = role ? roleConfig[role] : null;

  if (!action) {
    return (
      <div className="mx-4 mt-4 border border-surface-highest p-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-[24px] text-on-surface/20">bedtime</span>
        <div>
          <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40">
            Noc — czekaj na rozkazy
          </p>
          {roleHidden && (
            <p className="text-on-surface/30 text-xs mt-1 font-display">
              ↑ Odkryj rolę aby wykonać akcję nocną
            </p>
          )}
        </div>
      </div>
    );
  }

  if (role === "civilian") {
    return (
      <div className="mx-4 mt-4 border border-surface-highest bg-surface-highest/10 p-6 flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[40px] text-on-surface/20">bedtime</span>
        <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40 text-center">
          Czekasz w ukryciu
        </p>
        <Stamp color="default" rotate={-2}>
          Cywil
        </Stamp>
      </div>
    );
  }

  return (
    <div className={cn("mx-4 mt-4 border", action.borderColor, action.tint)}>
      <div className={cn("border-b px-3 py-2 flex items-center gap-2", action.borderColor)}>
        <span className="material-symbols-outlined text-[14px] text-on-surface/60">
          {action.icon}
        </span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
          {action.label}
        </span>
      </div>
      {error && <p className="text-primary-dark text-xs font-display mx-3 mt-2">{error}</p>}
      <div className="p-3 flex flex-col gap-1.5">
        {targets.map((p) => {
          const isBlockedDoctor = role === "doctor" && p.playerId === doctorLastTargetId;
          const isBlockedDetective =
            role === "detective" && investigatedPlayerIds?.includes(p.playerId);
          const isBlocked = isBlockedDoctor || isBlockedDetective;
          const _prevInvestigation =
            role === "detective" && investigatedPlayerIds?.includes(p.playerId);
          return (
            <button
              key={p.playerId}
              disabled={pending || isBlocked}
              onClick={() => onAction(action.type, p.playerId)}
              className={cn(
                "flex items-center gap-3 p-3 border transition-colors text-left",
                isBlocked
                  ? "border-surface-highest/30 text-on-surface/20 cursor-not-allowed"
                  : "border-surface-highest hover:border-primary/40 hover:bg-primary/5 active:opacity-70"
              )}
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface/30">
                person
              </span>
              <span className="font-display text-sm text-on-surface flex-1 uppercase tracking-wide">
                {p.nickname}
              </span>
              {isBlockedDoctor && (
                <span className="font-display text-[10px] text-on-surface/30 uppercase tracking-widest">
                  chroniony
                </span>
              )}
              {isBlockedDetective && (
                <span className="font-display text-[10px] text-on-surface/30 uppercase tracking-widest">
                  sprawdzony
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

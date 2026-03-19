"use client";

import type { PublicPlayer } from "@/db";
import type { Role, ActionType } from "@/db/types";
import type { ActionState, MafiaState } from "@/features/game/types";
import { ACTION_CONFIRMED } from "@/lib/constants";
import MafiaConsensusStatus from "@/features/game/components/shared/MafiaConsensusStatus";
import ActionConfirmation from "@/features/game/components/shared/ActionConfirmation";
import { Button, SectionHeader, InfoCard } from "@/components/ui";

interface NightActionPanelProps {
  role: Role | null;
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  roleHidden?: boolean;
  actionState: ActionState;
  mafiaState: MafiaState;
}

export default function NightActionPanel({
  role,
  targets,
  myAction,
  roleHidden = false,
  actionState,
  mafiaState,
}: NightActionPanelProps) {
  const { pending, error, onAction, onChangeDecision } = actionState;
  const { teamActions: mafiaTeamActions, currentNickname } = mafiaState;

  const actionMap: Record<Role, { type: ActionType; label: string; icon: string; color: string }> =
    {
      mafia: { type: "kill", label: "Wytypuj ofiarę", icon: "skull", color: "text-red-400" },
      detective: {
        type: "investigate",
        label: "Kogo przesłuchać?",
        icon: "search",
        color: "text-blue-400",
      },
      doctor: {
        type: "protect",
        label: "Kogo chronić tej nocy?",
        icon: "medical_services",
        color: "text-green-400",
      },
      civilian: {
        type: "wait",
        label: "Kogo obserwujesz?",
        icon: "visibility",
        color: "text-slate-400",
      },
    };

  if (myAction) {
    // Special handling for mafia: show voting consensus status instead of simple confirmation
    if (role === "mafia" && !roleHidden && mafiaTeamActions) {
      return (
        <div className="mx-5 mt-4">
          <SectionHeader icon="skull" className="text-red-400 mb-3 pl-1">
            Status głosowania mafii
          </SectionHeader>
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
      );
    }

    // Standard handling for other roles
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
          <p className="text-slate-600 text-xs mt-1">Odkryj rolę by zobaczyć szczegóły</p>
        )}
      </ActionConfirmation>
    );
  }

  const action = role ? actionMap[role] : null;

  if (!action) {
    return (
      <InfoCard icon="bedtime" title="Noc — czekaj na rozkazy" className="mx-5 mt-4">
        {roleHidden && (
          <p className="text-primary/60 text-xs mt-2 font-typewriter">
            ↑ Odkryj rolę aby wykonać akcję nocną
          </p>
        )}
      </InfoCard>
    );
  }

  return (
    <div className="mx-5 mt-4">
      <SectionHeader icon={action.icon} className={`mb-3 pl-1 ${action.color}`}>
        {action.label}
      </SectionHeader>
      {error && <p className="text-red-400 text-xs font-typewriter mb-2 px-1">{error}</p>}
      <div className="flex flex-col gap-2">
        {targets.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => onAction(action.type, p.playerId)}
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

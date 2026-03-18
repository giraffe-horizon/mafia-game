"use client";

import type { PublicPlayer, GameStateResponse } from "@/lib/db";
import type { Role, ActionType } from "@/db/types";
import { ACTION_CONFIRMED } from "@/lib/constants";
import MafiaConsensusStatus from "./MafiaConsensusStatus";
import { Button } from "@/components/ui";

export interface ActionState {
  pending: boolean;
  error: string;
  onAction: (type: ActionType, targetId: string) => void;
  onChangeDecision: () => void;
}

export interface MafiaState {
  teamActions?: GameStateResponse["mafiaTeamActions"];
  currentNickname?: string;
}

interface NightActionPanelProps {
  role: Role | null;
  targets: PublicPlayer[];
  myAction: { actionType: ActionType; targetPlayerId: string | null } | null;
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
          <p className="text-red-400 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">
            <span className="material-symbols-outlined text-[14px] align-middle mr-1">skull</span>
            Status głosowania mafii
          </p>
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
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
        <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          {actionLabel}
        </p>
        {myAction.targetPlayerId && !roleHidden && (
          <p className="text-slate-300 text-sm">
            <span className="text-white font-medium">{targetName}</span>
          </p>
        )}
        {roleHidden && (
          <p className="text-slate-600 text-xs mt-1">Odkryj rolę by zobaczyć szczegóły</p>
        )}
        <Button
          onClick={() => onChangeDecision()}
          variant="ghost"
          size="sm"
          icon="edit"
          className="mt-3 w-full"
        >
          Zmień decyzję
        </Button>
      </div>
    );
  }

  const action = role ? actionMap[role] : null;

  if (!action) {
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
        <span className="material-symbols-outlined text-[28px] text-slate-600 mb-1 block">
          bedtime
        </span>
        <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
          Noc — czekaj na rozkazy
        </p>
        {roleHidden && (
          <p className="text-primary/60 text-xs mt-2 font-typewriter">
            ↑ Odkryj rolę aby wykonać akcję nocną
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-5 mt-4">
      <p className={`text-xs font-typewriter uppercase tracking-widest mb-3 pl-1 ${action.color}`}>
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">
          {action.icon}
        </span>
        {action.label}
      </p>
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

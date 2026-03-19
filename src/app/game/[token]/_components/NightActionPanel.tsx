"use client";

import type { PublicPlayer, GameStateResponse } from "@/db";
import type { Role, ActionType } from "@/db/types";
import { ACTION_CONFIRMED } from "@/lib/constants";
import MafiaConsensusStatus from "./MafiaConsensusStatus";
import { Button, InfoCard } from "@/components/ui";

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
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  roleHidden?: boolean;
  actionState: ActionState;
  mafiaState: MafiaState;
}

const actionMap: Record<
  Role,
  { type: ActionType; label: string; icon: string; color: string; tint: string }
> = {
  mafia: {
    type: "kill",
    label: "Wytypuj ofiarę",
    icon: "skull",
    color: "text-stamp",
    tint: "border-stamp/25 bg-stamp/5",
  },
  detective: {
    type: "investigate",
    label: "Kogo przesłuchać?",
    icon: "search",
    color: "text-blue-400",
    tint: "border-blue-800/30 bg-blue-950/20",
  },
  doctor: {
    type: "protect",
    label: "Kogo chronić tej nocy?",
    icon: "medical_services",
    color: "text-green-400",
    tint: "border-green-800/30 bg-green-950/20",
  },
  civilian: {
    type: "wait",
    label: "Obserwujesz w cieniu",
    icon: "visibility",
    color: "text-on-surface/40",
    tint: "border-on-surface/10 bg-surface-low",
  },
};

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

  // ── Confirmed action state ──────────────────────────────────────────────────
  if (myAction) {
    // Mafia: show voting consensus dossier
    if (role === "mafia" && !roleHidden && mafiaTeamActions) {
      return (
        <div className="mx-5 mt-4 border border-stamp/25 bg-stamp/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[14px] text-stamp">skull</span>
            <p className="font-display font-bold uppercase tracking-widest text-[10px] text-stamp">
              Status głosowania mafii
            </p>
          </div>
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

    // Standard confirmation card
    const targetName =
      targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ??
      myAction.targetPlayerId;
    const actionLabel = roleHidden
      ? "Akcja wykonana"
      : (ACTION_CONFIRMED[myAction.actionType] ?? "Akcja wykonana");

    return (
      <div className="mx-5 mt-4 p-4 border border-on-surface/12 bg-surface-low">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/40">
            {actionLabel}
          </p>
          <span className="stamp stamp-green text-[9px] py-0 px-1.5">ZATWIERDZONE</span>
        </div>
        {myAction.targetPlayerId && !roleHidden && (
          <p className="font-display font-bold text-on-surface text-lg uppercase tracking-wider mt-1">
            {targetName}
          </p>
        )}
        {roleHidden && (
          <p className="text-on-surface/30 text-xs font-display mt-1">
            Odkryj rolę by zobaczyć szczegóły
          </p>
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

  // ── No action yet ──────────────────────────────────────────────────────────
  const action = role ? actionMap[role] : null;

  if (!action) {
    return (
      <InfoCard icon="bedtime" title="Noc — czekaj na rozkazy" className="mx-5 mt-4">
        {roleHidden && (
          <p className="text-primary/60 text-xs mt-2 font-display">
            ↑ Odkryj rolę aby wykonać akcję nocną
          </p>
        )}
      </InfoCard>
    );
  }

  // Civilian: muted "waiting" view — still submits an action
  if (role === "civilian") {
    return (
      <div className="mx-5 mt-4 border border-on-surface/10 bg-surface-low">
        <div className="p-4 border-b border-on-surface/8 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-on-surface/30">bedtime</span>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
            Czekasz w ukryciu...
          </p>
        </div>
        <p className="px-4 py-3 text-on-surface/25 text-xs font-display">
          Obserwujesz, słuchasz. Noc trwa.
        </p>
        {error && <p className="text-stamp text-xs font-display px-4 pb-3">{error}</p>}
        <div className="flex flex-col gap-0 border-t border-on-surface/8">
          {targets.map((p) => (
            <button
              key={p.playerId}
              disabled={pending}
              onClick={() => onAction(action.type, p.playerId)}
              className="flex items-center gap-3 px-4 py-3 border-b border-on-surface/6 hover:bg-on-surface/5 disabled:opacity-40 text-left last:border-0"
            >
              <span className="material-symbols-outlined text-[14px] text-on-surface/20">
                visibility
              </span>
              <span className="font-display text-on-surface/45 text-sm">{p.nickname}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Mafia / Detective / Doctor — role-tinted panel
  return (
    <div className={`mx-5 mt-4 border ${action.tint}`}>
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-on-surface/8">
        <span className={`material-symbols-outlined text-[16px] ${action.color}`}>
          {action.icon}
        </span>
        <p
          className={`font-display font-bold uppercase tracking-widest text-[10px] ${action.color}`}
        >
          {action.label}
        </p>
      </div>

      {error && <p className="text-stamp text-xs font-display px-4 pt-3">{error}</p>}

      {/* Player list */}
      <div className="flex flex-col">
        {targets.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => onAction(action.type, p.playerId)}
            className="flex items-center gap-3 px-4 py-3 border-b border-on-surface/8 hover:bg-on-surface/5 disabled:opacity-40 text-left last:border-0 group"
          >
            <span className="material-symbols-outlined text-[14px] text-on-surface/25 group-hover:text-on-surface/50">
              person
            </span>
            <span className="font-display text-on-surface text-sm flex-1">{p.nickname}</span>
            <span
              className={`material-symbols-outlined text-[14px] text-on-surface/15 group-hover:${action.color}`}
            >
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

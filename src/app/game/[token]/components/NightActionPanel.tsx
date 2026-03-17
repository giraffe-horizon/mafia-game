"use client";

import type { PublicPlayer } from "@/lib/db";

const ACTION_CONFIRMED: Record<string, string> = {
  kill: "Wytypowałeś ofiarę:",
  investigate: "Przesłuchujesz:",
  protect: "Chronisz tej nocy:",
  vote: "Oskarżasz:",
  wait: "Czekasz w ukryciu...",
};

export default function NightActionPanel({
  role,
  targets,
  myAction,
  pending,
  error,
  onAction,
  roleHidden = false,
  onChangeDecision,
}: {
  role: string | null;
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onAction: (type: string, targetId: string) => void;
  roleHidden?: boolean;
  onChangeDecision: () => void;
}) {
  const actionMap: Record<string, { type: string; label: string; icon: string; color: string }> = {
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
        <button
          onClick={() => onChangeDecision()}
          className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 font-typewriter uppercase tracking-wider text-xs transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          Zmień decyzję
        </button>
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

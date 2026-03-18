"use client";

import type { GameStateResponse, PublicPlayer } from "@/db";
import type { GamePhase, ActionType } from "@/db/types";
import type { MessageFormProps, MissionFormProps } from "../../types";
import GMGameTab from "./GMGameTab";
import GMMessageTab from "./GMMessageTab";
import GMMissionTab from "./GMMissionTab";
import GMSettingsTab from "./GMSettingsTab";

interface GMPanelProps {
  phase: GamePhase;
  players: PublicPlayer[];
  tab: "game" | "message" | "mission" | "settings";
  onTabChange: (t: "game" | "message" | "mission" | "settings") => void;
  phasePending: boolean;
  onPhase: (p: GamePhase) => void;
  messageForm: MessageFormProps;
  missionForm: MissionFormProps & {
    hostMissions?: any[];
    onCompleteMission: (id: string) => void;
    onDeleteMission: (id: string) => void;
  };
  hostActions?: GameStateResponse["hostActions"];
  phaseProgress?: GameStateResponse["phaseProgress"];
  onGmAction: (forPlayerId: string, actionType: ActionType, targetPlayerId: string) => void;
  onTransferGm: (playerId: string) => void;
  mafiaCountSetting: number;
  onMafiaCountSettingChange: (n: number) => void;
}

export default function GMPanel({
  phase,
  players,
  tab,
  onTabChange,
  phasePending,
  onPhase,
  messageForm,
  missionForm,
  hostActions,
  phaseProgress,
  onGmAction,
  onTransferGm,
  mafiaCountSetting,
  onMafiaCountSettingChange,
}: GMPanelProps) {
  const nextPhaseMap: Partial<
    Record<GamePhase, { label: string; phase: GamePhase; icon: string }>
  > = {
    night: { label: "Przejdź do Dnia", phase: "day", icon: "wb_sunny" },
    day: { label: "Głosowanie", phase: "voting", icon: "how_to_vote" },
    voting: { label: "Następna Noc", phase: "night", icon: "bedtime" },
  };
  const nextPhase = nextPhaseMap[phase];

  const TABS = [
    { id: "game" as const, icon: "gamepad", label: "Gra" },
    { id: "message" as const, icon: "mail", label: "Wiad." },
    { id: "mission" as const, icon: "task", label: "Misje" },
    { id: "settings" as const, icon: "settings", label: "Ustaw." },
  ];

  return (
    <div className="mx-5 mt-5 rounded-xl bg-black/40 border border-primary/20 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex-1 min-w-0 flex flex-col items-center py-2 gap-0.5 transition-colors text-[10px] font-typewriter uppercase tracking-wider whitespace-nowrap ${
              tab === t.id
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === "game" && (
          <GMGameTab
            hostActions={hostActions}
            players={players}
            phase={phase}
            phaseProgress={phaseProgress}
            onGmAction={onGmAction}
            onPhase={onPhase}
            phasePending={phasePending}
            nextPhase={nextPhase}
          />
        )}

        {tab === "message" && <GMMessageTab players={players} {...messageForm} />}

        {tab === "mission" && <GMMissionTab players={players} {...missionForm} />}

        {tab === "settings" && (
          <GMSettingsTab
            players={players}
            mafiaCountSetting={mafiaCountSetting}
            onMafiaCountSettingChange={onMafiaCountSettingChange}
            onTransferGm={onTransferGm}
          />
        )}
      </div>
    </div>
  );
}

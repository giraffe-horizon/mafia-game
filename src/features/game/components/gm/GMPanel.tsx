"use client";

import type { GameStateResponse, PublicPlayer } from "@/db";
import type { ActionType, GamePhase } from "@/db/types";
import type { MessageFormProps, MissionFormProps } from "@/features/game/types";
import type { PhaseInput } from "@/lib/api/schemas";
import GMGameTab from "@/features/game/components/gm/GMGameTab";
import GMMessageTab from "@/features/game/components/gm/GMMessageTab";
import GMMissionTab from "@/features/game/components/gm/GMMissionTab";
import GMSettingsTab from "@/features/game/components/gm/GMSettingsTab";

interface GMPanelProps {
  phase: GamePhase;
  players: PublicPlayer[];
  tab: "game" | "message" | "mission" | "settings";
  onTabChange: (t: "game" | "message" | "mission" | "settings") => void;
  phasePending: boolean;
  onPhase: (p: PhaseInput["phase"]) => void;
  messageForm: MessageFormProps;
  missionForm: MissionFormProps & {
    hostMissions?: GameStateResponse["hostMissions"];
    onCompleteMission: (id: string) => void;
    onDeleteMission: (id: string) => void;
  };
  hostActions?: GameStateResponse["hostActions"];
  phaseProgress?: GameStateResponse["phaseProgress"];
  onGmAction: (forPlayerId: string, actionType: ActionType, targetPlayerId: string) => void;
  mafiaCountSetting: number;
  onMafiaCountSettingChange: (n: number) => void;
}

const TABS = [
  { id: "game" as const, label: "GRA", icon: "gamepad" },
  { id: "message" as const, label: "WIAD.", icon: "mail" },
  { id: "mission" as const, label: "MISJE", icon: "task" },
  { id: "settings" as const, label: "USTAW.", icon: "settings" },
];

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
  mafiaCountSetting,
  onMafiaCountSettingChange,
}: GMPanelProps) {
  const nextPhaseMap: Partial<
    Record<GamePhase, { label: string; phase: PhaseInput["phase"]; icon: string }>
  > = {
    night: { label: "Przejdź do Dnia", phase: "day", icon: "wb_sunny" },
    day: { label: "Głosowanie", phase: "voting", icon: "how_to_vote" },
    voting: { label: "Następna Noc", phase: "night", icon: "bedtime" },
  };
  const nextPhase = nextPhaseMap[phase];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-surface-highest">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[9px] font-display font-black uppercase tracking-widest transition-colors ${
              tab === t.id
                ? "text-primary bg-surface-lowest border-t-2 border-t-primary"
                : "text-on-surface/40 hover:text-on-surface/70"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
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
          />
        )}
      </div>
    </div>
  );
}

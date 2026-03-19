"use client";

import type { GameStateResponse, PublicPlayer } from "@/db";
import type { GamePhase, ActionType } from "@/db/types";
import type { MessageFormProps, MissionFormProps } from "@/features/game/types";
import GMGameTab from "@/features/game/components/gm/GMGameTab";
import GMMessageTab from "@/features/game/components/gm/GMMessageTab";
import GMMissionTab from "@/features/game/components/gm/GMMissionTab";
import GMSettingsTab from "@/features/game/components/gm/GMSettingsTab";
import { TabBar } from "@/components/ui";

interface GMPanelProps {
  phase: GamePhase;
  players: PublicPlayer[];
  tab: "game" | "message" | "mission" | "settings";
  onTabChange: (t: "game" | "message" | "mission" | "settings") => void;
  phasePending: boolean;
  onPhase: (p: GamePhase) => void;
  messageForm: MessageFormProps;
  missionForm: MissionFormProps & {
    hostMissions?: GameStateResponse["hostMissions"];
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
      <TabBar tabs={TABS} activeTab={tab} onTabChange={(id) => onTabChange(id as typeof tab)} />

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

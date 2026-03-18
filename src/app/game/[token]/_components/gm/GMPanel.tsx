"use client";

import type { GameStateResponse, PublicPlayer } from "@/lib/db";
import GMGameTab from "./GMGameTab";
import GMMessageTab from "./GMMessageTab";
import GMMissionTab from "./GMMissionTab";
import GMSettingsTab from "./GMSettingsTab";

interface GMPanelProps {
  phase: string;
  players: PublicPlayer[];
  tab: "game" | "message" | "mission" | "settings";
  onTabChange: (t: "game" | "message" | "mission" | "settings") => void;
  phasePending: boolean;
  onPhase: (p: string) => void;
  msgTarget: string;
  msgContent: string;
  msgPending: boolean;
  msgError: string;
  onMsgTargetChange: (v: string) => void;
  onMsgContentChange: (v: string) => void;
  onSendMessage: () => void;
  msnTarget: string;
  msnDesc: string;
  msnPoints: number;
  msnPreset: string;
  msnPending: boolean;
  msnError: string;
  onMsnTargetChange: (v: string) => void;
  onMsnDescChange: (v: string) => void;
  onMsnPointsChange: (p: 1 | 2 | 3) => void;
  onMsnPresetChange: (v: string) => void;
  onCreateMission: () => void;
  hostMissions?: any[];
  onCompleteMission: (id: string) => void;
  onDeleteMission: (id: string) => void;
  hostActions?: GameStateResponse["hostActions"];
  phaseProgress?: GameStateResponse["phaseProgress"];
  onGmAction: (forPlayerId: string, actionType: string, targetPlayerId: string) => void;
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
  msgTarget,
  msgContent,
  msgPending,
  msgError,
  onMsgTargetChange,
  onMsgContentChange,
  onSendMessage,
  msnTarget,
  msnDesc,
  msnPoints,
  msnPreset,
  msnPending,
  msnError,
  onMsnTargetChange,
  onMsnDescChange,
  onMsnPointsChange,
  onMsnPresetChange,
  onCreateMission,
  hostMissions,
  onCompleteMission,
  onDeleteMission,
  hostActions,
  phaseProgress,
  onGmAction,
  onTransferGm,
  mafiaCountSetting,
  onMafiaCountSettingChange,
}: GMPanelProps) {
  const nextPhaseMap: Record<string, { label: string; phase: string; icon: string }> = {
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

        {tab === "message" && (
          <GMMessageTab
            players={players}
            msgTarget={msgTarget}
            msgContent={msgContent}
            msgPending={msgPending}
            msgError={msgError}
            onMsgTargetChange={onMsgTargetChange}
            onMsgContentChange={onMsgContentChange}
            onSendMessage={onSendMessage}
          />
        )}

        {tab === "mission" && (
          <GMMissionTab
            players={players}
            hostMissions={hostMissions}
            msnTarget={msnTarget}
            msnDesc={msnDesc}
            msnPoints={msnPoints}
            msnPreset={msnPreset}
            msnPending={msnPending}
            msnError={msnError}
            onMsnTargetChange={onMsnTargetChange}
            onMsnDescChange={onMsnDescChange}
            onMsnPointsChange={onMsnPointsChange}
            onMsnPresetChange={onMsnPresetChange}
            onCreateMission={onCreateMission}
            onCompleteMission={onCompleteMission}
            onDeleteMission={onDeleteMission}
          />
        )}

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

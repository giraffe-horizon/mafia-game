"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { ActionType, GamePhase } from "@/db/types";
import { useGameStore } from "@/stores/game/gameStore";
import { usePlayerState } from "@/hooks/game/usePlayerState";
import { useCurrentPhase } from "@/hooks/game/useCurrentPhase";
import { useMessageForm } from "@/hooks/game/useMessageForm";
import { useMissionForm } from "@/hooks/game/useMissionForm";
import { createHttpGameService } from "@/services/game/gameService";
import GMPanel from "@/components/game/gm/GMPanel";
import type { MessageFormProps, MissionFormProps } from "@/types/game";

const gameService = createHttpGameService();

export default function GMPanelContainer() {
  const { token } = useParams<{ token: string }>();
  const { nonHostPlayers } = usePlayerState();
  const { phase } = useCurrentPhase();

  const phasePending = useGameStore((s) => s.phasePending);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const submitGmAction = useGameStore((s) => s.submitGmAction);
  const transferGameMaster = useGameStore((s) => s.transferGameMaster);
  const hostActions = useGameStore((s) => s.state?.hostActions);
  const phaseProgress = useGameStore((s) => s.state?.phaseProgress);
  const hostMissions = useGameStore((s) => s.state?.hostMissions);
  const refetch = useGameStore((s) => s.refetch);

  const [mgTab, setMgTab] = useState<"game" | "message" | "mission" | "settings">("game");
  const [mafiaCountSetting, setMafiaCountSetting] = useState(0);

  const {
    msgTarget,
    msgContent,
    msgPending,
    msgError,
    setMsgTarget,
    setMsgContent,
    handleSendMessage,
  } = useMessageForm({ token, refetch, gameService });

  const {
    msnTarget,
    msnDesc,
    msnPoints,
    msnPreset,
    msnPending,
    msnError,
    setMsnTarget,
    setMsnDesc,
    setMsnPoints,
    setMsnPreset,
    handleCreateMission,
    handleCompleteMission,
    handleDeleteMission,
  } = useMissionForm({ token, refetch, gameService });

  if (!phase) return null;

  const messageForm: MessageFormProps = {
    msgTarget,
    msgContent,
    msgPending,
    msgError,
    onMsgTargetChange: setMsgTarget,
    onMsgContentChange: setMsgContent,
    onSendMessage: handleSendMessage,
  };

  const missionForm: MissionFormProps & {
    hostMissions?: typeof hostMissions;
    onCompleteMission: (id: string) => void;
    onDeleteMission: (id: string) => void;
  } = {
    msnTarget,
    msnDesc,
    msnPoints,
    msnPreset,
    msnPending,
    msnError,
    onMsnTargetChange: setMsnTarget,
    onMsnDescChange: setMsnDesc,
    onMsnPointsChange: setMsnPoints,
    onMsnPresetChange: setMsnPreset,
    onCreateMission: handleCreateMission,
    hostMissions,
    onCompleteMission: handleCompleteMission,
    onDeleteMission: handleDeleteMission,
  };

  const handlePhase = async (newPhase: GamePhase) => {
    await advancePhase(newPhase);
  };

  const handleGmAction = async (
    forPlayerId: string,
    actionType: ActionType,
    targetPlayerId: string
  ) => {
    await submitGmAction(forPlayerId, actionType, targetPlayerId);
  };

  return (
    <GMPanel
      phase={phase}
      players={nonHostPlayers}
      tab={mgTab}
      onTabChange={setMgTab}
      phasePending={phasePending}
      onPhase={handlePhase}
      messageForm={messageForm}
      missionForm={missionForm}
      hostActions={hostActions}
      phaseProgress={phaseProgress}
      onGmAction={handleGmAction}
      onTransferGm={(playerId: string) => transferGameMaster(playerId)}
      mafiaCountSetting={mafiaCountSetting}
      onMafiaCountSettingChange={setMafiaCountSetting}
    />
  );
}

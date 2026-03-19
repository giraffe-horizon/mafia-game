"use client";

import type { ActionType } from "@/db/types";
import type {
  NightPlayerState,
  NightViewState,
  NightActionData,
  ActionState,
  MafiaState,
} from "@/features/game/types";
import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useRoleVisibility } from "@/features/game/hooks/useRoleVisibility";
import { useActionTargets } from "@/features/game/hooks/useActionTargets";
import NightView from "@/features/game/components/phases/NightView";

export default function NightContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { roleVisible, toggleRole } = useRoleVisibility();
  const actionTargets = useActionTargets(roleVisible);

  const myAction = useGameStore((s) => (s.changingDecision ? null : (s.state?.myAction ?? null)));
  const actionPending = useGameStore((s) => s.actionPending);
  const actionError = useGameStore((s) => s.actionError);
  const submitAction = useGameStore((s) => s.submitAction);
  const setChangingDecision = useGameStore((s) => s.setChangingDecision);
  const mafiaTeamActions = useGameStore((s) => s.state?.mafiaTeamActions);
  const doctorLastTargetId = useGameStore((s) => s.state?.doctorLastTargetId);
  const investigatedPlayers = useGameStore((s) => s.state?.investigatedPlayers);
  const investigatedPlayerIds = investigatedPlayers?.map((ip) => ip.playerId);

  if (!currentPlayer) return null;

  const playerState: NightPlayerState = {
    isAlive: currentPlayer.isAlive,
    role: currentPlayer.role || undefined,
  };

  const viewState: NightViewState = { roleVisible, toggleRole };

  const actionState: ActionState = {
    pending: actionPending,
    error: actionError,
    onAction: (type: ActionType, targetId: string) => {
      setChangingDecision(false);
      submitAction(type, targetId);
    },
    onChangeDecision: () => setChangingDecision(true),
  };

  const mafiaState: MafiaState = {
    teamActions: mafiaTeamActions,
    currentNickname: currentPlayer.nickname,
  };

  const actionData: NightActionData = {
    actionTargets,
    myAction,
    actionState,
    mafiaState,
    doctorLastTargetId,
    investigatedPlayerIds,
  };

  return (
    <NightView
      isHost={isHost}
      currentPlayer={playerState}
      viewState={viewState}
      actionData={actionData}
      players={players}
    />
  );
}

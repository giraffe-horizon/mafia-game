"use client";

import type { ActionType } from "@/db/types";
import type {
  NightPlayerState,
  NightViewState,
  NightActionData,
  ActionState,
  MafiaState,
} from "@/types/game";
import { useGameStore } from "@/stores/game/gameStore";
import { usePlayerState } from "@/hooks/game/usePlayerState";
import { useRoleVisibility } from "@/hooks/game/useRoleVisibility";
import { useActionTargets } from "@/hooks/game/useActionTargets";
import NightView from "@/components/game/NightView";

export default function NightContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { roleVisible, setRoleVisible } = useRoleVisibility();
  const actionTargets = useActionTargets(roleVisible);

  const myAction = useGameStore((s) => (s.changingDecision ? null : (s.state?.myAction ?? null)));
  const actionPending = useGameStore((s) => s.actionPending);
  const actionError = useGameStore((s) => s.actionError);
  const submitAction = useGameStore((s) => s.submitAction);
  const setChangingDecision = useGameStore((s) => s.setChangingDecision);
  const mafiaTeamActions = useGameStore((s) => s.state?.mafiaTeamActions);

  if (!currentPlayer) return null;

  const playerState: NightPlayerState = {
    isAlive: currentPlayer.isAlive,
    role: currentPlayer.role || undefined,
  };

  const viewState: NightViewState = { roleVisible, setRoleVisible };

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

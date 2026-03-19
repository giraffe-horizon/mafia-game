"use client";

import type { ActionType } from "@/db/types";
import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import { useRoleVisibility } from "@/app/game/[token]/_hooks/useRoleVisibility";
import { useActionTargets } from "@/app/game/[token]/_hooks/useActionTargets";
import NightView from "@/app/game/[token]/_components/NightView";
import type {
  PlayerState,
  NightViewState,
  NightActionData,
} from "@/app/game/[token]/_components/NightView";
import type { ActionState, MafiaState } from "@/app/game/[token]/_components/NightActionPanel";

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

  const playerState: PlayerState = {
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

"use client";

import type { VotingPlayerState, VotingViewState, VoteState } from "@/types/game";
import { useGameStore } from "@/stores/game/gameStore";
import { usePlayerState } from "@/hooks/game/usePlayerState";
import { useRoleVisibility } from "@/hooks/game/useRoleVisibility";
import { useCurrentPhase } from "@/hooks/game/useCurrentPhase";
import VotingView from "@/components/game/VotingView";

export default function VotingContainer() {
  const { isHost, currentPlayer, players } = usePlayerState();
  const { roleVisible, setRoleVisible } = useRoleVisibility();
  const { phase } = useCurrentPhase();

  const myAction = useGameStore((s) => (s.changingDecision ? null : (s.state?.myAction ?? null)));
  const actionPending = useGameStore((s) => s.actionPending);
  const actionError = useGameStore((s) => s.actionError);
  const changingDecision = useGameStore((s) => s.changingDecision);
  const setChangingDecision = useGameStore((s) => s.setChangingDecision);
  const submitAction = useGameStore((s) => s.submitAction);
  const voteTally = useGameStore((s) => s.state?.voteTally);

  if (!currentPlayer || !phase) return null;

  const currentPlayerState: VotingPlayerState = {
    isAlive: currentPlayer.isAlive,
    role: currentPlayer.role || undefined,
  };

  const viewState: VotingViewState = { roleVisible, setRoleVisible, phase };

  const voteState: VoteState = {
    players,
    myAction,
    actionPending,
    actionError,
    changingDecision,
    setChangingDecision,
    onVote: (targetId: string) => {
      setChangingDecision(false);
      submitAction("vote", targetId);
    },
    voteTally,
  };

  return (
    <VotingView
      isHost={isHost}
      currentPlayer={currentPlayerState}
      viewState={viewState}
      voteState={voteState}
    />
  );
}

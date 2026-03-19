"use client";

import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import { useRoleVisibility } from "@/app/game/[token]/_hooks/useRoleVisibility";
import { useCurrentPhase } from "@/app/game/[token]/_hooks/useCurrentPhase";
import VotingView from "@/app/game/[token]/_components/VotingView";
import type {
  PlayerState,
  VotingViewState,
  VoteState,
} from "@/app/game/[token]/_components/VotingView";

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

  const currentPlayerState: PlayerState = {
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

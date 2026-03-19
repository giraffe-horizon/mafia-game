// Consolidated client-side game types
// Re-exports from DB types for convenience
export type { GameStateResponse, PublicPlayer, GameStatus, GamePhase, Role } from "@/db";
import type { PublicPlayer, GameStateResponse, ActionType } from "@/db";

// ---------------------------------------------------------------------------
// Night phase types
// ---------------------------------------------------------------------------

export interface ActionState {
  pending: boolean;
  error: string;
  onAction: (type: ActionType, targetId: string) => void;
  onChangeDecision: () => void;
}

export interface MafiaState {
  teamActions?: GameStateResponse["mafiaTeamActions"];
  currentNickname?: string;
}

export interface NightPlayerState {
  isAlive: boolean;
  role?: string;
}

export interface NightViewState {
  roleVisible: boolean;
  toggleRole: () => void;
}

export interface NightActionData {
  actionTargets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  actionState: ActionState;
  mafiaState: MafiaState;
  doctorLastTargetId?: string;
  investigatedPlayerIds?: string[];
}

// ---------------------------------------------------------------------------
// Voting phase types
// ---------------------------------------------------------------------------

export interface VoteTally {
  votedCount: number;
  totalVoters: number;
  results: Array<{
    playerId: string;
    nickname: string;
    votes: number;
  }>;
}

export interface VotingPlayerState {
  isAlive: boolean;
  role?: string;
}

export interface VotingViewState {
  roleVisible: boolean;
  toggleRole: () => void;
  phase: string;
}

export interface VoteState {
  players: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  actionPending: boolean;
  actionError: string;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;
  onVote: (targetId: string) => void;
  voteTally?: VoteTally;
}

// ---------------------------------------------------------------------------
// Review / missions types
// ---------------------------------------------------------------------------

export interface HostMission {
  id: string;
  playerNickname: string;
  description: string;
  points: number;
  isCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Toast type
// ---------------------------------------------------------------------------

export interface Toast {
  id: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Transition types
// ---------------------------------------------------------------------------

export type TransitionType =
  | "night_to_day"
  | "day_to_voting"
  | "voting_to_night"
  | "voting_ended"
  | "game_ended";

export interface TransitionScreen {
  icon: string;
  title: string;
  subtitle?: string;
  durationMs: number;
}

export interface TransitionData {
  type: TransitionType;
  screens: TransitionScreen[];
}

// ---------------------------------------------------------------------------
// Form props (grouped props interfaces to reduce prop drilling)
// ---------------------------------------------------------------------------

export interface MessageFormProps {
  msgTarget: string;
  msgContent: string;
  msgPending: boolean;
  msgError: string;
  onMsgTargetChange: (v: string) => void;
  onMsgContentChange: (v: string) => void;
  onSendMessage: () => void;
}

export interface MissionFormProps {
  msnTarget: string;
  msnDesc: string;
  msnPoints: 1 | 2 | 3;
  msnPreset: string;
  msnPending: boolean;
  msnError: string;
  onMsnTargetChange: (v: string) => void;
  onMsnDescChange: (v: string) => void;
  onMsnPointsChange: (p: 1 | 2 | 3) => void;
  onMsnPresetChange: (v: string) => void;
  onCreateMission: () => void;
}

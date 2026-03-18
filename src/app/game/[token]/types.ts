// Shared types for game client components
export type { GameStateResponse, PublicPlayer, GameStatus, GamePhase, Role } from "@/db";

// Grouped props interfaces to reduce prop drilling

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

export interface ActionFormProps {
  actionTargets: any[];
  myAction: any;
  actionPending: boolean;
  actionError: string;
  changingDecision: boolean;
  setChangingDecision: (changing: boolean) => void;
  onAction: (type: string, targetId: string) => void;
}

export interface RoleViewProps {
  currentPlayer: {
    isAlive: boolean;
    role?: string;
  };
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
}

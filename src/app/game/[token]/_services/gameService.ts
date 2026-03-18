// Transport-agnostic game service interface
// In the future: replace HTTP implementation with WebSocket without changing consumers

import type { GameStateResponse } from "@/db";
import type {
  ActionInput,
  PhaseInput,
  StartGameInput,
  MessageInput,
  SetupPlayerInput,
  RenamePlayerInput,
  KickPlayerInput,
  CreateMissionInput,
  UpdateCharacterInput,
  RematchInput,
  TransferGmInput,
} from "@/app/api/lib/schemas";
import * as apiClient from "@/lib/api-client";

// Common result types
export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface LeaveResult {
  success: boolean;
  gameEnded: boolean;
  error?: string;
}

export interface StartGameOpts {
  mafiaCount?: number;
  mode?: "full" | "simple";
}

export interface GameService {
  // Core state management
  fetchState(token: string): Promise<GameStateResponse>;

  // Player actions
  submitAction(token: string, type: string, targetPlayerId?: string): Promise<ActionResult>;
  setupPlayer(token: string, nickname: string, characterId: string): Promise<ActionResult>;
  renamePlayer(token: string, nickname: string): Promise<ActionResult>;
  updateCharacter(token: string, characterId: string): Promise<ActionResult>;

  // Game flow
  startGame(token: string, opts?: StartGameOpts): Promise<ActionResult>;
  advancePhase(token: string, phase: string): Promise<ActionResult>;

  // Communication
  sendMessage(token: string, target: string, content: string): Promise<ActionResult>;

  // Game management
  leaveGame(token: string): Promise<LeaveResult>;
  kickPlayer(token: string, playerId: string): Promise<ActionResult>;
  transferGameMaster(token: string, newHostPlayerId: string): Promise<ActionResult>;
  rematchGame(token: string, opts?: StartGameOpts): Promise<ActionResult>;
  finalizeGame(token: string): Promise<ActionResult>;

  // Mission management
  createMission(
    token: string,
    targetPlayerId: string,
    description: string,
    isSecret?: boolean,
    points?: number
  ): Promise<ActionResult>;
  completeMission(token: string, missionId: string): Promise<ActionResult>;
  deleteMission(token: string, missionId: string): Promise<ActionResult>;
}

// HTTP implementation
export function createHttpGameService(): GameService {
  return {
    fetchState: apiClient.fetchGameState,

    submitAction: async (
      token: string,
      type: string,
      targetPlayerId?: string
    ): Promise<ActionResult> => {
      return apiClient.submitAction(token, { type, targetPlayerId });
    },

    setupPlayer: async (
      token: string,
      nickname: string,
      characterId: string
    ): Promise<ActionResult> => {
      return apiClient.setupPlayer(token, { nickname, characterId });
    },

    renamePlayer: async (token: string, nickname: string): Promise<ActionResult> => {
      return apiClient.renamePlayer(token, { nickname });
    },

    updateCharacter: async (token: string, characterId: string): Promise<ActionResult> => {
      return apiClient.updateCharacter(token, { characterId });
    },

    startGame: async (token: string, opts?: StartGameOpts): Promise<ActionResult> => {
      return apiClient.startGame(token, opts);
    },

    advancePhase: async (token: string, phase: string): Promise<ActionResult> => {
      return apiClient.advancePhase(token, { phase });
    },

    sendMessage: async (
      token: string,
      toPlayerId: string,
      content: string
    ): Promise<ActionResult> => {
      return apiClient.sendMessage(token, {
        content,
        toPlayerId: toPlayerId === "all" ? undefined : toPlayerId,
      });
    },

    leaveGame: apiClient.leaveGame,

    kickPlayer: async (token: string, playerId: string): Promise<ActionResult> => {
      return apiClient.kickPlayer(token, { playerId });
    },

    transferGameMaster: async (token: string, newHostPlayerId: string): Promise<ActionResult> => {
      return apiClient.transferGameMaster(token, { newHostPlayerId });
    },

    rematchGame: async (token: string, opts?: StartGameOpts): Promise<ActionResult> => {
      return apiClient.rematchGame(token, opts);
    },

    finalizeGame: apiClient.finalizeGame,

    createMission: async (
      token: string,
      targetPlayerId: string,
      description: string,
      isSecret?: boolean,
      points?: number
    ): Promise<ActionResult> => {
      return apiClient.createMission(token, { targetPlayerId, description, isSecret, points });
    },

    completeMission: apiClient.completeMission,

    deleteMission: apiClient.deleteMission,
  };
}

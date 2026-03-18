import { z } from "zod";

// Common reusable schemas
const gameMode = z.enum(["full", "simple"]);
const nonEmptyString = z.string().min(1);
const playerId = z.string().min(1);
const nickname = z.string().min(1).max(20);

// API endpoint schemas
export const createGameSchema = z.object({
  nickname: nickname.optional(),
  characterId: nonEmptyString.optional(),
});

export const joinGameSchema = z.object({
  code: nonEmptyString,
  nickname: nickname.optional(),
  characterId: nonEmptyString.optional(),
});

export const actionSchema = z.object({
  type: nonEmptyString,
  targetPlayerId: playerId.optional(),
  forPlayerId: playerId.optional(),
});

export const phaseSchema = z.object({
  phase: nonEmptyString,
});

export const startGameSchema = z.object({
  mafiaCount: z.number().int().positive().optional(),
  mode: gameMode.optional(),
});

export const messageSchema = z.object({
  content: nonEmptyString,
  toPlayerId: playerId.optional(),
});

export const setupPlayerSchema = z.object({
  nickname: nickname,
  characterId: nonEmptyString,
});

export const renamePlayerSchema = z.object({
  nickname: nickname,
});

export const kickPlayerSchema = z.object({
  playerId: playerId,
});

export const createMissionSchema = z.object({
  targetPlayerId: playerId,
  description: nonEmptyString,
  isSecret: z.boolean().optional(),
  points: z.number().int().nonnegative().optional(),
});

export const updateCharacterSchema = z.object({
  characterId: nonEmptyString,
});

export const rematchSchema = z.object({
  mafiaCount: z.number().int().positive().optional(),
  mode: gameMode.optional(),
});

export const transferGmSchema = z.object({
  newHostPlayerId: playerId,
});

// Export schema types for TypeScript inference
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type PhaseInput = z.infer<typeof phaseSchema>;
export type StartGameInput = z.infer<typeof startGameSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SetupPlayerInput = z.infer<typeof setupPlayerSchema>;
export type RenamePlayerInput = z.infer<typeof renamePlayerSchema>;
export type KickPlayerInput = z.infer<typeof kickPlayerSchema>;
export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
export type RematchInput = z.infer<typeof rematchSchema>;
export type TransferGmInput = z.infer<typeof transferGmSchema>;

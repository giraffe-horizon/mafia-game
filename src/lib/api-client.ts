import type { GameStateResponse } from "@/db";
import type {
  CreateGameInput,
  JoinGameInput,
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

// Common fetch options
const defaultOptions: RequestInit = {
  headers: { "Content-Type": "application/json" },
};

// Helper for handling responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// Helper for POST requests with body
async function postRequest<TInput, TOutput>(url: string, body?: TInput): Promise<TOutput> {
  const response = await fetch(url, {
    method: "POST",
    ...defaultOptions,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return handleResponse<TOutput>(response);
}

// Helper for DELETE requests
async function deleteRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "DELETE", ...defaultOptions });
  return handleResponse<T>(response);
}

// Helper for GET requests
async function getRequest<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return handleResponse<T>(response);
}

// Characters API
export async function fetchCharacters(): Promise<
  Array<{ id: string; slug: string; name: string; name_pl: string; avatar_url: string }>
> {
  return getRequest("/api/characters");
}

// Game creation and joining
export async function createGame(input?: CreateGameInput): Promise<{ token: string }> {
  return postRequest("/api/game/create", input || {});
}

export async function joinGame(input: JoinGameInput): Promise<{ token: string }> {
  return postRequest("/api/game/join", input);
}

// Game state
export async function fetchGameState(token: string): Promise<GameStateResponse> {
  return getRequest(`/api/game/${token}/state`);
}

// Player setup and actions
export async function setupPlayer(
  token: string,
  input: SetupPlayerInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/setup`, input);
}

export async function startGame(
  token: string,
  input?: StartGameInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/start`, input);
}

export async function submitAction(
  token: string,
  input: ActionInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/action`, input);
}

export async function advancePhase(
  token: string,
  input: PhaseInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/phase`, input);
}

export async function sendMessage(
  token: string,
  input: MessageInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/message`, input);
}

// Game management
export async function leaveGame(
  token: string
): Promise<{ success: boolean; gameEnded: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/leave`);
}

export async function kickPlayer(
  token: string,
  input: KickPlayerInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/kick`, input);
}

export async function transferGameMaster(
  token: string,
  input: TransferGmInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/transfer-gm`, input);
}

export async function renamePlayer(
  token: string,
  input: RenamePlayerInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/rename`, input);
}

export async function updateCharacter(
  token: string,
  input: UpdateCharacterInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/character`, input);
}

export async function rematchGame(
  token: string,
  input?: RematchInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/rematch`, input);
}

export async function finalizeGame(token: string): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/finalize`);
}

// Mission management
export async function createMission(
  token: string,
  input: CreateMissionInput
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/mission`, input);
}

export async function completeMission(
  token: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  return postRequest(`/api/game/${token}/mission/${missionId}/complete`);
}

export async function deleteMission(
  token: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  return deleteRequest(`/api/game/${token}/mission/${missionId}`);
}

// Ranking
export async function fetchRanking(token: string): Promise<{
  ranking: Array<{
    playerId: string;
    nickname: string;
    role: string | null;
    isAlive: boolean;
    missionPoints: number;
    missionsDone: number;
    missionsTotal: number;
    survived: boolean;
    won: boolean;
    totalScore: number;
  }>;
  gameStatus: string;
  winner: string | null;
  round: number;
}> {
  return getRequest(`/api/ranking?token=${token}`);
}

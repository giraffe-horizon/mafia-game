import { nanoid } from "nanoid";

export type GameStatus = "lobby" | "playing" | "finished";
export type GamePhase = "lobby" | "night" | "day" | "voting" | "ended";
export type Role = "mafia" | "detective" | "doctor" | "civilian";

export interface Game {
  id: string;
  code: string;
  hostPlayerId: string;
  status: GameStatus;
  phase: GamePhase;
  round: number;
  winner: string | null;
  createdAt: string;
}

export interface GamePlayer {
  gameId: string;
  playerId: string;
  nickname: string;
  token: string;
  role: Role | null;
  isAlive: boolean;
  isHost: boolean;
}

// Persist in globalThis so Next.js hot-reload doesn't wipe state
declare global {
  var __mafiaStore:
    | {
        games: Map<string, Game>;
        playersByToken: Map<string, GamePlayer>;
        playersByGameId: Map<string, GamePlayer[]>;
        codeToGameId: Map<string, string>;
      }
    | undefined;
}

if (!globalThis.__mafiaStore) {
  globalThis.__mafiaStore = {
    games: new Map(),
    playersByToken: new Map(),
    playersByGameId: new Map(),
    codeToGameId: new Map(),
  };
}

const store = globalThis.__mafiaStore;

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return "MAFIA-" + suffix;
}

export function createGame(hostNickname: string): {
  game: Game;
  hostPlayer: GamePlayer;
} {
  const gameId = nanoid();
  const hostPlayerId = nanoid();
  const hostToken = nanoid();

  let code = generateSessionCode();
  while (store.codeToGameId.has(code)) code = generateSessionCode();

  const game: Game = {
    id: gameId,
    code,
    hostPlayerId,
    status: "lobby",
    phase: "lobby",
    round: 0,
    winner: null,
    createdAt: new Date().toISOString(),
  };

  const hostPlayer: GamePlayer = {
    gameId,
    playerId: hostPlayerId,
    nickname: hostNickname,
    token: hostToken,
    role: null,
    isAlive: true,
    isHost: true,
  };

  store.games.set(gameId, game);
  store.playersByToken.set(hostToken, hostPlayer);
  store.playersByGameId.set(gameId, [hostPlayer]);
  store.codeToGameId.set(code, gameId);

  return { game, hostPlayer };
}

export function joinGame(
  code: string,
  nickname: string
): { game: Game; player: GamePlayer } | null {
  const normalizedCode = code.toUpperCase().trim();
  const gameId = store.codeToGameId.get(normalizedCode);
  if (!gameId) return null;

  const game = store.games.get(gameId);
  if (!game || game.status !== "lobby") return null;

  const playerId = nanoid();
  const token = nanoid();

  const player: GamePlayer = {
    gameId,
    playerId,
    nickname,
    token,
    role: null,
    isAlive: true,
    isHost: false,
  };

  store.playersByToken.set(token, player);
  const players = store.playersByGameId.get(gameId) ?? [];
  players.push(player);
  store.playersByGameId.set(gameId, players);

  return { game, player };
}

export interface PublicPlayer {
  nickname: string;
  isAlive: boolean;
  isHost: boolean;
  role: Role | null;
  isYou: boolean;
}

export interface GameStateResponse {
  game: {
    id: string;
    code: string;
    status: GameStatus;
    phase: GamePhase;
    round: number;
    winner: string | null;
  };
  currentPlayer: {
    nickname: string;
    token: string;
    role: Role | null;
    isAlive: boolean;
    isHost: boolean;
  };
  players: PublicPlayer[];
}

export function getGameState(token: string): GameStateResponse | null {
  const player = store.playersByToken.get(token);
  if (!player) return null;

  const game = store.games.get(player.gameId);
  if (!game) return null;

  const allPlayers = store.playersByGameId.get(player.gameId) ?? [];

  return {
    game: {
      id: game.id,
      code: game.code,
      status: game.status,
      phase: game.phase,
      round: game.round,
      winner: game.winner,
    },
    currentPlayer: {
      nickname: player.nickname,
      token: player.token,
      role: player.role,
      isAlive: player.isAlive,
      isHost: player.isHost,
    },
    players: allPlayers.map((p) => ({
      nickname: p.nickname,
      isAlive: p.isAlive,
      isHost: p.isHost,
      // Show roles only to host, or to the player themselves once game starts
      role:
        player.isHost || (game.status === "playing" && p.token === token)
          ? p.role
          : game.status === "playing" && player.isHost
            ? p.role
            : null,
      isYou: p.token === token,
    })),
  };
}

export function startGame(token: string): { success: boolean; error?: string } {
  const player = store.playersByToken.get(token);
  if (!player?.isHost) return { success: false, error: "Tylko MG może startować grę" };

  const game = store.games.get(player.gameId);
  if (!game) return { success: false, error: "Gra nie istnieje" };
  if (game.status !== "lobby") return { success: false, error: "Gra już trwa" };

  const players = store.playersByGameId.get(player.gameId) ?? [];
  if (players.length < 4) return { success: false, error: "Potrzeba minimum 4 graczy" };

  const n = players.length;
  const mafiaCount = Math.ceil(n / 3);
  const roles: Role[] = [
    ...Array<Role>(mafiaCount).fill("mafia"),
    "detective",
    "doctor",
    ...Array<Role>(n - mafiaCount - 2).fill("civilian"),
  ];

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  players.forEach((p, i) => {
    p.role = roles[i];
  });

  game.status = "playing";
  game.phase = "night";
  game.round = 1;

  return { success: true };
}

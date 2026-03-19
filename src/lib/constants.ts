import type { Role, GamePhase, ActionType } from "@/db/types";

export const ROLE_LABELS: Record<Role | "gm" | string, string> = {
  mafia: "Mafia",
  detective: "Policjant",
  doctor: "Lekarz",
  civilian: "Cywil",
  gm: "Mistrz Gry",
};

export const ROLE_COLORS: Record<Role | "gm" | string, string> = {
  mafia: "text-red-500",
  detective: "text-blue-400",
  doctor: "text-green-400",
  civilian: "text-slate-300",
  gm: "text-amber-400",
};

export const ROLE_ICONS: Record<Role | "gm" | string, string> = {
  mafia: "masks",
  detective: "search",
  doctor: "medical_services",
  civilian: "person",
  gm: "manage_accounts",
};

export const PHASE_LABELS: Record<GamePhase | string, string> = {
  lobby: "Lobby",
  night: "Noc",
  day: "Dzień",
  voting: "Głosowanie",
  review: "Przegląd misji",
  ended: "Koniec",
};

export const PHASE_ICONS: Record<Exclude<GamePhase, "review"> | string, string> = {
  night: "bedtime",
  day: "wb_sunny",
  voting: "how_to_vote",
  lobby: "groups",
  ended: "emoji_events",
};

export const ACTION_CONFIRMED: Record<ActionType | string, string> = {
  kill: "Wytypowałeś ofiarę:",
  investigate: "Przesłuchujesz:",
  protect: "Chronisz tej nocy:",
  vote: "Oskarżasz:",
  wait: "Czekasz w ukryciu...",
};

// ---------------------------------------------------------------------------
// Magic numbers
// ---------------------------------------------------------------------------
export const MIN_PLAYERS_FULL = 5;
export const MIN_PLAYERS_SIMPLE = 3;
export const MAX_NICKNAME_LENGTH = 20;
export const COPY_FEEDBACK_MS = 2000;
export const RANKING_POLL_MS = 5000;

// ---------------------------------------------------------------------------
// Ranking position colors
// ---------------------------------------------------------------------------
const POSITION_COLORS = [
  "text-amber-400",
  "text-slate-300",
  "text-orange-400",
  "text-slate-500",
] as const;

export function positionColor(index: number): string {
  return POSITION_COLORS[index] ?? POSITION_COLORS[3];
}

// ---------------------------------------------------------------------------
// Auto mafia count based on player count
// ---------------------------------------------------------------------------
export function autoMafiaCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 11) return 3;
  return 4;
}

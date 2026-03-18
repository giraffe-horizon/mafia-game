export const ROLE_LABELS: Record<string, string> = {
  mafia: "Mafia",
  detective: "Detektyw",
  doctor: "Doktor",
  civilian: "Cywil",
  gm: "Mistrz Gry",
};

export const ROLE_COLORS: Record<string, string> = {
  mafia: "text-red-500",
  detective: "text-blue-400",
  doctor: "text-green-400",
  civilian: "text-slate-300",
  gm: "text-amber-400",
};

export const ROLE_ICONS: Record<string, string> = {
  mafia: "masks",
  detective: "search",
  doctor: "medical_services",
  civilian: "person",
  gm: "manage_accounts",
};

export const PHASE_LABELS: Record<string, string> = {
  lobby: "Lobby",
  night: "Noc",
  day: "Dzień",
  voting: "Głosowanie",
  review: "Przegląd misji",
  ended: "Koniec",
};

export const PHASE_ICONS: Record<string, string> = {
  night: "bedtime",
  day: "wb_sunny",
  voting: "how_to_vote",
  lobby: "groups",
  ended: "emoji_events",
};

export const ACTION_CONFIRMED: Record<string, string> = {
  kill: "Wytypowałeś ofiarę:",
  investigate: "Przesłuchujesz:",
  protect: "Chronisz tej nocy:",
  vote: "Oskarżasz:",
  wait: "Czekasz w ukryciu...",
};

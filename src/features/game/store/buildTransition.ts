import type { GamePhase } from "@/db";
import type { TransitionData, TransitionScreen } from "@/features/game/types";

export function buildTransition(
  prevPhase: GamePhase,
  newPhase: GamePhase,
  round: number,
  lastPhaseResult?: {
    type: "kill" | "no_kill" | "eliminate" | "no_eliminate";
    playerId?: string;
    nickname?: string;
    role?: string;
  },
  winner?: string | null
): TransitionData | null {
  const screens: TransitionScreen[] = [];

  // lobby → night (game start)
  if (prevPhase === "lobby" && newPhase === "night") {
    screens.push({
      icon: "casino",
      title: "Gra rozpoczęta!",
      subtitle: "Role zostały przydzielone",
      durationMs: 2500,
    });
    screens.push({
      icon: "bedtime",
      title: "Zapada noc...",
      subtitle: `Runda ${round}`,
      durationMs: 2000,
    });
    return { type: "game_start", screens };
  }

  // night → day
  if (prevPhase === "night" && newPhase === "day") {
    screens.push({
      icon: "wb_sunny",
      title: "Nadchodzi świt...",
      subtitle: "Miasto się budzi",
      durationMs: 2000,
    });

    if (lastPhaseResult?.type === "kill" && lastPhaseResult.nickname) {
      screens.push({
        icon: "skull",
        title: `${lastPhaseResult.nickname}`,
        subtitle: "nie przeżył tej nocy",
        durationMs: 3000,
      });
    } else {
      screens.push({
        icon: "shield",
        title: "Wszyscy przeżyli!",
        subtitle: "Tej nocy nikt nie zginął",
        durationMs: 2500,
      });
    }
    return { type: "night_to_day", screens };
  }

  // day → voting
  if (prevPhase === "day" && newPhase === "voting") {
    screens.push({
      icon: "how_to_vote",
      title: "Głosowanie",
      subtitle: "Czas na oskarżenia",
      durationMs: 2000,
    });
    return { type: "day_to_voting", screens };
  }

  // voting → night (new round)
  if (prevPhase === "voting" && newPhase === "night") {
    if (lastPhaseResult?.type === "eliminate" && lastPhaseResult.nickname) {
      screens.push({
        icon: "gavel",
        title: "Wyrok zapadł...",
        subtitle: `${lastPhaseResult.nickname} został wyeliminowany`,
        durationMs: 2500,
      });
    } else {
      screens.push({
        icon: "gavel",
        title: "Wyrok zapadł...",
        subtitle: "Nikt nie został wyeliminowany",
        durationMs: 2500,
      });
    }
    screens.push({
      icon: "bedtime",
      title: "Zapada noc...",
      subtitle: `Runda ${round}`,
      durationMs: 2000,
    });
    return { type: "voting_to_night", screens };
  }

  // voting → review/ended (game over via vote elimination)
  if (prevPhase === "voting" && (newPhase === "review" || newPhase === "ended")) {
    if (lastPhaseResult?.type === "eliminate" && lastPhaseResult.nickname) {
      screens.push({
        icon: "gavel",
        title: "Wyrok zapadł...",
        subtitle: `${lastPhaseResult.nickname} został wyeliminowany`,
        durationMs: 2500,
      });
    }
    const mafiaWon = winner === "mafia";
    screens.push({
      icon: "emoji_events",
      title: mafiaWon ? "Mafia wygrywa!" : "Miasto wygrywa!",
      subtitle: mafiaWon ? "Przestępcy przejęli kontrolę" : "Sprawiedliwość zwyciężyła",
      durationMs: 3000,
    });
    return { type: "game_ended", screens };
  }

  // night → review/ended (game over via night kill)
  if (prevPhase === "night" && (newPhase === "review" || newPhase === "ended")) {
    if (lastPhaseResult?.type === "kill" && lastPhaseResult.nickname) {
      screens.push({
        icon: "skull",
        title: `${lastPhaseResult.nickname}`,
        subtitle: "nie przeżył tej nocy",
        durationMs: 2500,
      });
    }
    const mafiaWon = winner === "mafia";
    screens.push({
      icon: "emoji_events",
      title: mafiaWon ? "Mafia wygrywa!" : "Miasto wygrywa!",
      subtitle: mafiaWon ? "Przestępcy przejęli kontrolę" : "Sprawiedliwość zwyciężyła",
      durationMs: 3000,
    });
    return { type: "game_ended", screens };
  }

  // review → ended (finalize)
  if (prevPhase === "review" && newPhase === "ended") {
    const mafiaWon = winner === "mafia";
    screens.push({
      icon: "emoji_events",
      title: mafiaWon ? "Mafia wygrywa!" : "Miasto wygrywa!",
      subtitle: mafiaWon ? "Przestępcy przejęli kontrolę" : "Sprawiedliwość zwyciężyła",
      durationMs: 3000,
    });
    return { type: "game_ended", screens };
  }

  return null;
}

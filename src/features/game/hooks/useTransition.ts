"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/features/game/store/gameStore";
import type { GamePhase } from "@/db";
import type { TransitionData, TransitionScreen } from "@/features/game/types";

function buildTransition(
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

export function useTransition(): void {
  const phase = useGameStore((s) => s.state?.game.phase);
  const round = useGameStore((s) => s.state?.game.round);
  const winner = useGameStore((s) => s.state?.game.winner);
  const lastPhaseResult = useGameStore((s) => s.state?.lastPhaseResult);
  const showTransition = useGameStore((s) => s.showTransition);

  const prevPhaseRef = useRef<GamePhase | undefined>(undefined);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip the very first render — don't show transition on page load
    if (!phase) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevPhaseRef.current = phase;
      return;
    }

    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (!prevPhase || prevPhase === phase) return;

    // Don't show transitions from lobby
    if (prevPhase === "lobby") return;

    const transition = buildTransition(prevPhase, phase, round ?? 1, lastPhaseResult, winner);
    if (transition) {
      showTransition(transition);
    }
  }, [phase, round, winner, lastPhaseResult, showTransition]);
}

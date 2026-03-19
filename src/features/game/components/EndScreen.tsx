"use client";

import { useState, useEffect } from "react";
import { Button, Stamp } from "@/components/ui";
import { useGameStore } from "@/features/game/store/gameStore";
import ScoringTable from "@/features/game/components/shared/ScoringTable";

export default function EndScreen(_props: Record<string, never> = {}) {
  const state = useGameStore((s) => s.state);
  const rematchGame = useGameStore((s) => s.rematchGame);
  const roundScores = useGameStore((s) => s.roundScores);
  const ranking = useGameStore((s) => s.ranking);
  const rankingMeta = useGameStore((s) => s.rankingMeta);
  const fetchRanking = useGameStore((s) => s.fetchRanking);
  const fetchRoundScores = useGameStore((s) => s.fetchRoundScores);
  const [rematchPending, setRematchPending] = useState(false);

  const token = state?.currentPlayer.token;

  useEffect(() => {
    if (!token) return;
    fetchRanking();
    fetchRoundScores();
  }, [token, fetchRanking, fetchRoundScores]);

  if (!state) return null;

  const { game, currentPlayer } = state;
  const isHost = currentPlayer.isHost;
  const totalRounds = rankingMeta?.round ?? 0;

  const handleRematch = async () => {
    setRematchPending(true);
    try {
      await rematchGame();
    } finally {
      setRematchPending(false);
    }
  };

  const winnerLabel = game.winner === "mafia" ? "MAFIA WYGRYWA" : "MIASTO WYGRYWA";
  const winnerIcon = game.winner === "mafia" ? "masks" : "groups";
  const winnerColor = game.winner === "mafia" ? "text-primary-dark" : "text-green-400";
  const stampVariant: "classified" | "approved" =
    game.winner === "mafia" ? "classified" : "approved";

  const isWinner =
    (game.winner === "mafia" && currentPlayer.role === "mafia") ||
    (game.winner === "town" && currentPlayer.role !== "mafia");

  return (
    <div className="absolute inset-0 z-20 bg-background flex flex-col overflow-y-auto">
      {/* Winner stamp section */}
      <div className="flex flex-col items-center justify-center py-10 px-6 border-b border-surface-highest gap-4">
        <span className={`material-symbols-outlined text-[64px] ${winnerColor}`}>{winnerIcon}</span>
        <Stamp variant={stampVariant} rotate={-2} className="text-lg px-4 py-1">
          {winnerLabel}
        </Stamp>
        {!isHost && (
          <p
            className={`font-display font-black text-sm uppercase tracking-widest ${isWinner ? "text-green-400" : "text-on-surface/40"}`}
          >
            {isWinner ? "Wygrałeś!" : "Przegrałeś"}
          </p>
        )}
        {isHost && (
          <Button
            onClick={handleRematch}
            disabled={rematchPending}
            loading={rematchPending}
            icon="replay"
            className="mt-2"
          >
            {rematchPending ? "Resetuję..." : "Następna runda"}
          </Button>
        )}
      </div>

      {/* Scoring */}
      <div className="flex-1 px-4 py-4">
        <ScoringTable roundScores={roundScores} ranking={ranking} totalRounds={totalRounds} />
      </div>
    </div>
  );
}

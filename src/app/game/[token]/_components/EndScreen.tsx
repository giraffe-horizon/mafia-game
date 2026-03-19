"use client";

import { useState, useEffect } from "react";
import { SectionHeader, StatusItem, Button } from "@/components/ui";
import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import ScoringTable from "@/app/game/[token]/_components/ScoringTable";

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

  const { game, currentPlayer, hostMissions } = state;
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

  const winnerLabel = game.winner === "mafia" ? "Mafia wygrała!" : "Miasto wygrało!";
  const winnerIcon = game.winner === "mafia" ? "masks" : "groups";
  const winnerColor = game.winner === "mafia" ? "text-red-500" : "text-green-400";

  const isWinner =
    (game.winner === "mafia" && currentPlayer.role === "mafia") ||
    (game.winner === "town" && currentPlayer.role !== "mafia");

  const missionSummary =
    hostMissions && hostMissions.length > 0
      ? Object.values(
          hostMissions.reduce<
            Record<string, { nickname: string; completed: number; total: number; points: number }>
          >((acc, m) => {
            if (!acc[m.playerId])
              acc[m.playerId] = { nickname: m.playerNickname, completed: 0, total: 0, points: 0 };
            acc[m.playerId].total++;
            if (m.isCompleted) {
              acc[m.playerId].completed++;
              acc[m.playerId].points += m.points;
            }
            return acc;
          }, {})
        )
      : [];

  return (
    <div className="mx-5 mt-5">
      {/* Section 1: Winner */}
      <div className="p-6 rounded-xl bg-black/60 border border-primary/20 text-center">
        <span className={`material-symbols-outlined text-[56px] ${winnerColor} mb-3 block`}>
          {winnerIcon}
        </span>
        <p
          className={`font-typewriter text-2xl font-bold uppercase tracking-widest ${winnerColor} mb-2`}
        >
          {winnerLabel}
        </p>
        {!isHost && (
          <p
            className={`font-typewriter text-sm uppercase tracking-wider ${isWinner ? "text-green-400" : "text-slate-500"}`}
          >
            {isWinner ? "Wygrałeś!" : "Przegrałeś"}
          </p>
        )}
        {isHost && (
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={handleRematch}
              disabled={rematchPending}
              loading={rematchPending}
              icon="replay"
              className="mx-auto"
            >
              {rematchPending ? "Resetuję..." : "NASTĘPNA RUNDA"}
            </Button>
          </div>
        )}
      </div>

      <ScoringTable roundScores={roundScores} ranking={ranking} totalRounds={totalRounds} />

      {/* Mission summary (GM only) */}
      {isHost && missionSummary.length > 0 && (
        <div className="mt-5">
          <SectionHeader className="mb-3 pl-1">Podsumowanie misji</SectionHeader>
          <div className="flex flex-col gap-2">
            {missionSummary.map((s) => (
              <StatusItem
                key={s.nickname}
                icon={
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    person
                  </span>
                }
                label={s.nickname}
                labelClassName="text-white"
                trailing={
                  <>
                    <span className="text-slate-400 text-xs font-typewriter">
                      {s.completed}/{s.total} misji
                    </span>
                    {s.points > 0 && (
                      <span className="text-yellow-400 text-xs font-typewriter font-bold">
                        +{s.points}pkt
                      </span>
                    )}
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { SectionHeader, StatusItem, Button, Card } from "@/components/ui";
import { useGameStore } from "../_stores/gameStore";
import * as apiClient from "@/lib/api-client";

interface RoundScore {
  playerId: string;
  nickname: string;
  missionPoints: number;
  survived: boolean;
  won: boolean;
  totalScore: number;
}

interface RankingEntry {
  playerId: string;
  nickname: string;
  totalScore: number;
  roundsPlayed: number;
}

export default function EndScreen(_props: Record<string, never> = {}) {
  const state = useGameStore((s) => s.state);
  const rematchGame = useGameStore((s) => s.rematchGame);
  const [rematchPending, setRematchPending] = useState(false);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [totalRounds, setTotalRounds] = useState(0);

  const token = state?.currentPlayer.token;

  useEffect(() => {
    if (!token) return;

    async function fetchScoring() {
      try {
        const [scoresData, rankingData] = await Promise.all([
          apiClient.fetchRoundScores(token!),
          apiClient.fetchRanking(token!),
        ]);

        if (scoresData.scores) {
          setRoundScores(scoresData.scores);
        }

        if (rankingData.ranking) {
          setRanking(
            rankingData.ranking.map((r) => ({
              playerId: r.playerId,
              nickname: r.nickname,
              totalScore: r.totalScore,
              roundsPlayed: r.roundsPlayed,
            }))
          );
          setTotalRounds(rankingData.round);
        }
      } catch {
        // Scores are optional
      }
    }

    fetchScoring();
  }, [token]);

  if (!state) return null;

  const { game, currentPlayer, hostMissions } = state;
  const isHost = currentPlayer.isHost;

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
  const isMafiaWin = game.winner === "mafia";

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

  const positionColor = (i: number) =>
    i === 0
      ? "text-amber-400"
      : i === 1
        ? "text-on-surface/60"
        : i === 2
          ? "text-orange-400"
          : "text-on-surface/35";

  return (
    <div className="mx-5 mt-5">
      {/* Dramatic stamp winner announcement */}
      <div className="border border-on-surface/15 bg-surface-low p-6 text-center mb-5 tape-corner">
        <span
          className={`material-symbols-outlined text-[52px] mb-3 block ${isMafiaWin ? "text-stamp" : "text-green-400"}`}
        >
          {winnerIcon}
        </span>

        {/* Stamp-style winner text */}
        <div className="flex justify-center mb-4">
          <span className={`stamp ${isMafiaWin ? "stamp-red" : "stamp-green"} text-lg px-4 py-2`}>
            {winnerLabel}
          </span>
        </div>

        {!isHost && (
          <p
            className={`font-display font-bold uppercase tracking-widest text-sm ${isWinner ? "text-green-400" : "text-on-surface/40"}`}
          >
            {isWinner ? "✓ Wygrałeś tę rundę" : "Przegrałeś"}
          </p>
        )}

        {isHost && (
          <div className="mt-4">
            <Button
              onClick={handleRematch}
              disabled={rematchPending}
              loading={rematchPending}
              icon="replay"
              className="mx-auto"
            >
              {rematchPending ? "Resetuję..." : "Następna runda"}
            </Button>
          </div>
        )}
      </div>

      {/* Scoring table */}
      {roundScores.length > 0 && (
        <div className="mb-5">
          <SectionHeader className="mb-3 pl-1">
            Punktacja {totalRounds > 1 ? `— runda ${totalRounds}` : ""}
          </SectionHeader>
          <Card className="overflow-hidden">
            <table className="w-full text-sm font-display">
              <thead>
                <tr className="border-b border-on-surface/10 text-on-surface/30 text-[10px] uppercase tracking-wider">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-1">Gracz</th>
                  <th className="text-center py-2 px-1" title="Misje">
                    M
                  </th>
                  <th className="text-center py-2 px-1" title="Przeżycie">
                    P
                  </th>
                  <th className="text-center py-2 px-1" title="Wygrana">
                    W
                  </th>
                  <th className="text-center py-2 px-1">Runda</th>
                  <th className="text-right py-2 px-3 text-stamp">Razem</th>
                </tr>
              </thead>
              <tbody>
                {[...roundScores]
                  .map((s) => {
                    const cumulative = ranking.find((r) => r.playerId === s.playerId);
                    return { ...s, cumulativeScore: cumulative?.totalScore ?? s.totalScore };
                  })
                  .sort((a, b) => b.cumulativeScore - a.cumulativeScore)
                  .map((s, i) => (
                    <tr
                      key={s.playerId}
                      className={`border-b border-on-surface/8 ${i === 0 ? "bg-amber-950/10" : ""}`}
                    >
                      <td className={`py-2 px-3 font-bold ${positionColor(i)}`}>{i + 1}</td>
                      <td className="py-2 px-1 text-on-surface">{s.nickname}</td>
                      <td className="text-center py-2 px-1 text-on-surface/40">
                        {s.missionPoints > 0 ? `+${s.missionPoints}` : "—"}
                      </td>
                      <td className="text-center py-2 px-1 text-on-surface/40">
                        {s.survived ? "+1" : "—"}
                      </td>
                      <td className="text-center py-2 px-1 text-on-surface/40">
                        {s.won ? "+3" : "—"}
                      </td>
                      <td className="text-center py-2 px-1 text-on-surface/35">{s.totalScore}</td>
                      <td className={`text-right py-2 px-3 font-bold text-lg ${positionColor(i)}`}>
                        {s.cumulativeScore}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
          <div className="mt-2 flex gap-3 text-[10px] text-on-surface/25 font-display px-1 uppercase tracking-wider">
            <span>M = Misje</span>
            <span>P = Przeżycie (+1)</span>
            <span>W = Wygrana (+3)</span>
          </div>
        </div>
      )}

      {/* Mission summary (GM only) */}
      {isHost && missionSummary.length > 0 && (
        <div className="mb-5">
          <SectionHeader className="mb-3 pl-1">Podsumowanie misji</SectionHeader>
          <div className="flex flex-col gap-2">
            {missionSummary.map((s) => (
              <StatusItem
                key={s.nickname}
                icon={
                  <span className="material-symbols-outlined text-[18px] text-on-surface/30">
                    person
                  </span>
                }
                label={s.nickname}
                labelClassName="text-on-surface"
                trailing={
                  <>
                    <span className="text-on-surface/40 text-xs font-display">
                      {s.completed}/{s.total}
                    </span>
                    {s.points > 0 && (
                      <span className="text-stamp text-xs font-display font-bold">
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

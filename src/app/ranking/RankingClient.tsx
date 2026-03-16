"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface RankingEntry {
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
}

const ROLE_LABELS: Record<string, string> = {
  mafia: "Mafia",
  detective: "Detektyw",
  doctor: "Doktor",
  civilian: "Cywil",
  gm: "MG",
};

const ROLE_COLORS: Record<string, string> = {
  mafia: "text-red-400",
  detective: "text-blue-400",
  doctor: "text-green-400",
  civilian: "text-slate-400",
  gm: "text-amber-400",
};

export default function RankingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [gameStatus, setGameStatus] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Brak tokena sesji");
      setLoading(false);
      return;
    }

    async function fetchRanking() {
      try {
        const res = await fetch(`/api/ranking?token=${token}`);
        if (!res.ok) {
          setError("Nie znaleziono sesji");
          return;
        }
        const data = await res.json();
        setRanking(data.ranking);
        setGameStatus(data.gameStatus);
        setWinner(data.winner);
        setRound(data.round);
      } catch {
        setError("Błąd połączenia");
      } finally {
        setLoading(false);
      }
    }

    fetchRanking();
    const interval = setInterval(fetchRanking, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-[#1a0c0c] md:mx-auto md:my-8 md:rounded-[2.5rem]">
        <span className="material-symbols-outlined text-[40px] text-[#da0b0b] animate-spin mb-4">refresh</span>
        <p className="text-slate-400 font-['Special_Elite'] uppercase tracking-widest text-sm">Ładowanie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-[#1a0c0c] md:mx-auto md:my-8 md:rounded-[2.5rem]">
        <span className="material-symbols-outlined text-[48px] text-[#da0b0b] mb-4">error</span>
        <p className="text-slate-300 font-['Special_Elite'] text-lg text-center px-8">{error}</p>
        <button onClick={() => router.push("/")} className="mt-6 text-[#da0b0b] font-['Special_Elite'] uppercase tracking-widest text-sm">← Powrót</button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-[#1a0c0c] overflow-hidden shadow-2xl md:mx-auto md:my-8 md:rounded-[2.5rem]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
        <button
          onClick={() => token ? router.push(`/game/${token}`) : router.push("/")}
          className="size-10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="font-['Special_Elite'] text-[#da0b0b] text-base font-bold tracking-widest drop-shadow-[0_0_6px_rgba(218,11,11,0.5)]">
            RANKING
          </h2>
          <p className="text-slate-500 text-xs font-['Special_Elite'] uppercase tracking-widest">
            {gameStatus === "finished" ? "Koniec gry" : `Runda ${round}`}
            {winner && ` · ${winner === "mafia" ? "Mafia" : "Miasto"} wygrywa`}
          </p>
        </div>
        <div className="size-10" />
      </div>

      {/* Ranking list */}
      <div className="flex-1 px-5 py-4">
        <div className="flex flex-col gap-2">
          {ranking.map((r, i) => (
            <div
              key={r.playerId}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                i === 0 ? "border-amber-700/50 bg-amber-950/20" :
                i === 1 ? "border-slate-600/50 bg-slate-900/20" :
                i === 2 ? "border-orange-900/50 bg-orange-950/10" :
                "border-slate-800 bg-black/20"
              } ${!r.isAlive ? "opacity-50" : ""}`}
            >
              {/* Position */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-['Special_Elite'] ${
                i === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-600/50" :
                i === 1 ? "bg-slate-500/20 text-slate-300 border border-slate-600/50" :
                i === 2 ? "bg-orange-500/20 text-orange-400 border border-orange-600/50" :
                "bg-slate-800 text-slate-500 border border-slate-700"
              }`}>
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">{r.nickname}</span>
                  {!r.isAlive && (
                    <span className="text-slate-600 text-xs font-['Special_Elite']">☠</span>
                  )}
                  {r.won && (
                    <span className="text-amber-400 text-xs">⭐</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {r.role && (
                    <span className={`text-xs font-['Special_Elite'] ${ROLE_COLORS[r.role] ?? "text-slate-500"}`}>
                      {ROLE_LABELS[r.role] ?? r.role}
                    </span>
                  )}
                  {r.missionsTotal > 0 && (
                    <span className="text-slate-600 text-xs">
                      📋 {r.missionsDone}/{r.missionsTotal}
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <span className={`text-lg font-bold font-['Special_Elite'] ${
                  i === 0 ? "text-amber-400" : "text-white"
                }`}>
                  {r.totalScore}
                </span>
                <p className="text-slate-600 text-xs">pkt</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 p-3 rounded-lg bg-black/30 border border-slate-800">
          <p className="text-slate-500 text-xs font-['Special_Elite'] uppercase tracking-widest mb-2">Punktacja</p>
          <div className="flex flex-col gap-1 text-xs text-slate-600">
            <span>⭐ Wygrana z drużyną: +3 pkt</span>
            <span>💀 Przeżycie: +1 pkt</span>
            <span>📋 Misje: wg punktacji misji</span>
          </div>
        </div>
      </div>
    </div>
  );
}

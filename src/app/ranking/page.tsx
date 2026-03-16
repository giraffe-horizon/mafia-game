"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RankingEntry } from "@/app/api/ranking/route";

export default function RankingPage() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((data) => {
        if (data.ranking) setRanking(data.ranking);
        else setError("Błąd wczytywania rankingu");
      })
      .catch(() => setError("Błąd połączenia"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative flex min-h-screen sm:min-h-0 w-full sm:max-w-[390px] flex-col bg-background-dark overflow-hidden shadow-2xl sm:mx-auto sm:my-8 sm:rounded-[2.5rem]">
      {/* Background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
        <button
          onClick={() => router.push("/")}
          className="size-10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="font-typewriter text-primary text-base font-bold tracking-widest drop-shadow-[0_0_6px_rgba(218,11,11,0.5)]">
            RANKING
          </h2>
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
            Globalny ranking graczy
          </p>
        </div>
        <div className="size-10" />
      </div>

      {/* Scoring legend */}
      <div className="relative z-10 mx-5 mt-4 p-3 rounded-lg bg-black/30 border border-slate-800">
        <p className="text-slate-500 text-[10px] font-typewriter uppercase tracking-widest mb-1">
          Punktacja
        </p>
        <div className="flex gap-3 text-xs font-typewriter text-slate-400">
          <span>Wygrana <span className="text-green-400">+3</span></span>
          <span>·</span>
          <span>Misja <span className="text-yellow-400">+1/2/3</span></span>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8 mt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin mb-3">refresh</span>
            <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">Ładowanie...</p>
          </div>
        )}

        {error && (
          <p className="text-red-400 font-typewriter text-center py-8">{error}</p>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-slate-700 mb-3 block">leaderboard</span>
            <p className="text-slate-500 font-typewriter text-sm uppercase tracking-widest">
              Brak zakończonych gier
            </p>
          </div>
        )}

        {!loading && ranking.length > 0 && (
          <div className="flex flex-col gap-2">
            {ranking.map((entry, idx) => (
              <div
                key={`${entry.nickname}-${idx}`}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  idx === 0
                    ? "border-yellow-800/60 bg-yellow-950/20"
                    : idx === 1
                    ? "border-slate-500/50 bg-slate-800/20"
                    : idx === 2
                    ? "border-orange-900/50 bg-orange-950/20"
                    : "border-slate-800 bg-black/20"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-typewriter shrink-0 ${
                    idx === 0
                      ? "bg-yellow-900/50 text-yellow-400"
                      : idx === 1
                      ? "bg-slate-700/50 text-slate-300"
                      : idx === 2
                      ? "bg-orange-900/50 text-orange-400"
                      : "bg-slate-800/50 text-slate-500"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{entry.nickname}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-slate-600 text-[10px] font-typewriter">
                      {entry.gamesPlayed} {entry.gamesPlayed === 1 ? "gra" : "gier"}
                    </span>
                    <span className="text-slate-700 text-[10px]">·</span>
                    <span className="text-green-600 text-[10px] font-typewriter">
                      {entry.gamesWon} wygranych
                    </span>
                    <span className="text-slate-700 text-[10px]">·</span>
                    <span className="text-yellow-600 text-[10px] font-typewriter">
                      {entry.missionPoints} pkt misji
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-primary font-typewriter font-bold text-lg leading-none">
                    {entry.totalScore}
                  </p>
                  <p className="text-slate-600 text-[10px] font-typewriter">pkt</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import * as apiClient from "@/lib/api-client";
import Modal from "@/components/ui/Modal";

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

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function RankingModal({ isOpen, onClose, token }: RankingModalProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [gameStatus, setGameStatus] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError("");

    async function fetchData() {
      try {
        const data = await apiClient.fetchRanking(token);
        setRanking(data.ranking);
        setGameStatus(data.gameStatus);
        setWinner(data.winner);
        setRound(data.round);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd połączenia");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isOpen, token]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md w-full max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
        <div className="flex-1 text-center">
          <h3 className="font-typewriter text-primary text-base font-bold tracking-widest drop-shadow-[0_0_6px_rgba(218,11,11,0.5)]">
            RANKING
          </h3>
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
            {gameStatus === "finished" ? "Koniec gry" : `Runda ${round}`}
            {winner && ` · ${winner === "mafia" ? "Mafia" : "Miasto"} wygrywa`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">
              refresh
            </span>
            <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
              Ładowanie...
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
            <p className="text-slate-300 font-typewriter text-sm text-center">{error}</p>
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <p className="text-slate-500 font-typewriter text-sm text-center py-8">Brak danych</p>
        )}

        {!loading && !error && ranking.length > 0 && (
          <>
            {/* Winner banner */}
            {winner && gameStatus === "finished" && (
              <div className="mb-4 p-3 rounded-lg bg-amber-950/30 border border-amber-700/50 text-center">
                <span className="text-amber-400 font-typewriter font-bold text-sm uppercase tracking-widest">
                  {winner === "mafia" ? "Mafia" : "Miasto"} wygrywa!
                </span>
              </div>
            )}

            {/* Ranking list */}
            <div className="flex flex-col gap-2">
              {ranking.map((r, i) => (
                <div
                  key={r.playerId}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    i === 0
                      ? "border-amber-700/50 bg-amber-950/20"
                      : i === 1
                        ? "border-slate-600/50 bg-slate-900/20"
                        : i === 2
                          ? "border-orange-900/50 bg-orange-950/10"
                          : "border-slate-800 bg-black/20"
                  } ${!r.isAlive ? "opacity-50" : ""}`}
                >
                  {/* Position */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-typewriter ${
                      i === 0
                        ? "bg-amber-500/20 text-amber-400 border border-amber-600/50"
                        : i === 1
                          ? "bg-slate-500/20 text-slate-300 border border-slate-600/50"
                          : i === 2
                            ? "bg-orange-500/20 text-orange-400 border border-orange-600/50"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{r.nickname}</span>
                      {!r.isAlive && (
                        <span className="text-slate-600 text-xs font-typewriter">☠</span>
                      )}
                      {r.won && <span className="text-amber-400 text-xs">⭐</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.missionsTotal > 0 && (
                        <span className="text-slate-600 text-xs">
                          📋 {r.missionsDone}/{r.missionsTotal}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold font-typewriter ${
                        i === 0 ? "text-amber-400" : "text-white"
                      }`}
                    >
                      {r.totalScore}
                    </span>
                    <p className="text-slate-600 text-xs">pkt</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 p-3 rounded-lg bg-black/30 border border-slate-800">
              <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2">
                Punktacja
              </p>
              <div className="flex flex-col gap-1 text-xs text-slate-600">
                <span>⭐ Wygrana z drużyną: +3 pkt</span>
                <span>💀 Przeżycie: +1 pkt</span>
                <span>📋 Misje: wg punktacji misji</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

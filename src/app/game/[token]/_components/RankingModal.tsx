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

const POSITION_STAMPS = ["ZŁOTO", "SREBRO", "BRĄZ"] as const;
const POSITION_COLORS = [
  "text-amber-400 border-amber-500/50 bg-amber-950/20",
  "text-on-surface/50 border-on-surface/25 bg-surface-highest/30",
  "text-orange-400 border-orange-600/40 bg-orange-950/15",
] as const;

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
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-on-surface/10">
        <div className="flex-1 text-center">
          <div className="flex justify-center mb-1">
            <span
              className="stamp stamp-red text-[11px] px-3 py-0.5"
              style={{ transform: "rotate(-1deg)" }}
            >
              RANKING
            </span>
          </div>
          <p className="text-on-surface/30 text-[10px] font-display uppercase tracking-widest">
            {gameStatus === "finished" ? "Koniec gry" : `Runda ${round}`}
            {winner && ` · ${winner === "mafia" ? "Mafia" : "Miasto"} wygrywa`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute top-3 right-3 size-8 flex items-center justify-center text-on-surface/30 hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="material-symbols-outlined text-[40px] text-stamp animate-spin mb-4">
              refresh
            </span>
            <p className="text-on-surface/30 font-display uppercase tracking-widest text-xs">
              Ładowanie...
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="material-symbols-outlined text-[48px] text-stamp mb-4">error</span>
            <p className="text-on-surface/60 font-display text-sm text-center">{error}</p>
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <p className="text-on-surface/30 font-display text-sm text-center py-8 uppercase tracking-widest">
            Brak danych
          </p>
        )}

        {!loading && !error && ranking.length > 0 && (
          <>
            {/* Winner banner */}
            {winner && gameStatus === "finished" && (
              <div className="mb-4 p-3 border border-amber-700/30 bg-amber-950/20 text-center">
                <span className="text-amber-400 font-display font-bold text-sm uppercase tracking-widest">
                  {winner === "mafia" ? "Mafia" : "Miasto"} wygrywa!
                </span>
              </div>
            )}

            {/* Ranking list */}
            <div className="flex flex-col gap-1.5">
              {ranking.map((r, i) => (
                <div
                  key={r.playerId}
                  className={`flex items-center gap-3 p-3 border ${
                    i < 3 ? POSITION_COLORS[i] : "border-on-surface/10 bg-background"
                  } ${!r.isAlive ? "opacity-50" : ""}`}
                >
                  {/* Position stamp */}
                  <div className="shrink-0 w-8 flex justify-center">
                    {i < 3 ? (
                      <span
                        className={`stamp text-[8px] py-0 px-1 ${
                          i === 0 ? "stamp-green" : "border-current"
                        } ${POSITION_COLORS[i].split(" ")[0]}`}
                        style={{
                          borderColor: "currentColor",
                          transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                        }}
                      >
                        {POSITION_STAMPS[i]}
                      </span>
                    ) : (
                      <span className="font-display font-bold text-on-surface/25 text-sm">
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-on-surface text-sm uppercase tracking-wide truncate">
                        {r.nickname}
                      </span>
                      {!r.isAlive && (
                        <span className="material-symbols-outlined text-[12px] text-on-surface/30">
                          skull
                        </span>
                      )}
                      {r.won && (
                        <span className="material-symbols-outlined text-[12px] text-amber-400">
                          star
                        </span>
                      )}
                    </div>
                    {r.missionsTotal > 0 && (
                      <p className="text-on-surface/30 text-[10px] font-display">
                        Misje: {r.missionsDone}/{r.missionsTotal}
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-lg font-bold font-display ${
                        i === 0 ? "text-amber-400" : "text-on-surface"
                      }`}
                    >
                      {r.totalScore}
                    </span>
                    <p className="text-on-surface/25 text-[10px] font-display">pkt</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-5 p-3 border border-on-surface/10 bg-background">
              <p className="text-on-surface/25 text-[10px] font-display uppercase tracking-widest mb-2">
                Punktacja
              </p>
              <div className="flex flex-col gap-1 text-[10px] font-display text-on-surface/35">
                <span>Wygrana z drużyną: +3 pkt</span>
                <span>Przeżycie: +1 pkt</span>
                <span>Misje: wg punktacji misji</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

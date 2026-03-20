"use client";

import { useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { Stamp } from "@/components/ui";
import { RANKING_POLL_MS } from "@/lib/constants";
import { useGameStore } from "@/features/game/store/gameStore";

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const POSITION_STAMPS = ["I", "II", "III"];
const POSITION_COLORS = [
  "text-yellow-400 border-yellow-600",
  "text-on-surface/60 border-on-surface/30",
  "text-orange-400 border-orange-700",
];

export default function RankingModal({ isOpen, onClose, token }: RankingModalProps) {
  const ranking = useGameStore((s) => s.ranking);
  const rankingMeta = useGameStore((s) => s.rankingMeta);
  const fetchRanking = useGameStore((s) => s.fetchRanking);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const gameStatus = rankingMeta?.gameStatus ?? "";
  const winner = rankingMeta?.winner ?? null;
  const round = rankingMeta?.round ?? 0;
  const loading = isOpen && ranking.length === 0 && !rankingMeta;

  useEffect(() => {
    if (!isOpen || !token) return;
    fetchRanking();
    intervalRef.current = setInterval(fetchRanking, RANKING_POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, token, fetchRanking]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full max-h-[85vh] flex flex-col rounded-none"
    >
      {/* Dossier header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-highest bg-surface-low">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">leaderboard</span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-primary">
              Ranking
            </span>
          </div>
          <p className="font-display text-[10px] text-on-surface/40 uppercase tracking-widest mt-0.5">
            {gameStatus === "finished" ? "Koniec gry" : `Runda ${round}`}
            {winner && ` · ${winner === "mafia" ? "Mafia" : "Miasto"} wygrywa`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="text-on-surface/50 hover:text-on-surface/60"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              refresh
            </span>
            <p className="font-display text-on-surface/40 uppercase tracking-widest text-xs">
              Ładowanie...
            </p>
          </div>
        )}

        {!loading && ranking.length === 0 && (
          <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center py-8">
            Brak danych
          </p>
        )}

        {!loading && ranking.length > 0 && (
          <div className="p-4 flex flex-col gap-2">
            {/* Winner banner */}
            {winner && gameStatus === "finished" && (
              <div className="border border-primary/30 bg-primary/5 p-3 flex items-center justify-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  {winner === "mafia" ? "masks" : "groups"}
                </span>
                <Stamp color={winner === "mafia" ? "red" : "green"} rotate={-1}>
                  {winner === "mafia" ? "Mafia wygrywa!" : "Miasto wygrywa!"}
                </Stamp>
              </div>
            )}

            {/* Ranking list */}
            {ranking.map((r, i) => (
              <div
                key={r.playerId}
                className={`flex items-center gap-3 p-3 border ${
                  i === 0
                    ? "border-yellow-800/50 bg-yellow-950/10"
                    : i === 1
                      ? "border-surface-highest bg-surface-highest/5"
                      : i === 2
                        ? "border-orange-900/40 bg-orange-950/10"
                        : "border-surface-highest/40"
                } ${!r.isAlive ? "opacity-50" : ""}`}
              >
                {/* Position */}
                <span
                  className={`font-display font-black text-sm border px-1.5 py-0.5 min-w-[32px] text-center ${
                    i < 3 ? POSITION_COLORS[i] : "text-on-surface/30 border-on-surface/20"
                  }`}
                >
                  {i < 3 ? POSITION_STAMPS[i] : `${i + 1}`}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-sm uppercase tracking-wide text-on-surface truncate">
                      {r.nickname}
                    </span>
                    {!r.isAlive && (
                      <span className="material-symbols-outlined text-[12px] text-on-surface/40">
                        skull
                      </span>
                    )}
                    {r.won && (
                      <span className="material-symbols-outlined text-[12px] text-yellow-400">
                        star
                      </span>
                    )}
                  </div>
                  {r.missionsTotal > 0 && (
                    <span className="font-display text-[10px] text-on-surface/40 uppercase tracking-widest">
                      misje: {r.missionsDone}/{r.missionsTotal}
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="text-right">
                  <span
                    className={`font-display font-black text-lg ${i === 0 ? "text-yellow-400" : "text-on-surface"}`}
                  >
                    {r.totalScore}
                  </span>
                  <p className="font-display text-[10px] text-on-surface/40 uppercase tracking-widest">
                    pkt
                  </p>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="mt-4 border border-surface-highest p-3">
              <p className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/40 mb-2">
                Punktacja
              </p>
              <div className="flex flex-col gap-1">
                <span className="font-display text-xs text-on-surface/40">
                  Wygrana z drużyną: +3 pkt
                </span>
                <span className="font-display text-xs text-on-surface/40">Przeżycie: +1 pkt</span>
                <span className="font-display text-xs text-on-surface/40">
                  Misje: wg punktacji misji
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

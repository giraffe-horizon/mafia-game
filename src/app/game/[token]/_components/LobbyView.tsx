"use client";

import { useEffect } from "react";
import QRCode from "react-qr-code";
import type { PublicPlayer } from "@/db";
import LobbyTransferGm from "./LobbyTransferGm";
import { SectionHeader, InfoCard } from "@/components/ui";
import { useGameStore } from "../_stores/gameStore";

interface LobbyViewProps {
  isHost: boolean;
  gameCode: string;
  joinUrl: string;
  copied: boolean;
  copyCode: () => void;
  setCopied: (copied: boolean) => void;
  nonHostPlayers: PublicPlayer[];
  gameMode: "full" | "simple";
  setGameMode: (mode: "full" | "simple") => void;
  mafiaCount: number;
  setMafiaCount: (count: number) => void;
  starting: boolean;
  onStart: () => void;
  onTransferGm: (playerId: string) => void;
  round: number;
}

export default function LobbyView({
  isHost,
  gameCode,
  joinUrl,
  copied,
  copyCode,
  setCopied,
  nonHostPlayers,
  gameMode,
  setGameMode,
  mafiaCount,
  setMafiaCount,
  starting,
  onStart,
  onTransferGm,
  round,
}: LobbyViewProps) {
  const ranking = useGameStore((s) => s.ranking);
  const fetchRanking = useGameStore((s) => s.fetchRanking);

  const hasPlayedRounds = round > 0;

  useEffect(() => {
    if (!hasPlayedRounds) return;
    fetchRanking();
  }, [hasPlayedRounds, fetchRanking]);

  const positionColor = (i: number) =>
    i === 0
      ? "text-amber-400"
      : i === 1
        ? "text-slate-300"
        : i === 2
          ? "text-orange-400"
          : "text-slate-500";

  return (
    <>
      {/* Session ranking from previous rounds */}
      {hasPlayedRounds && ranking.length > 0 && (
        <div className="mx-5 mt-5">
          <SectionHeader className="mb-3">Ranking sesji</SectionHeader>
          <div className="flex flex-col gap-2">
            {ranking.map((r, i) => (
              <div
                key={r.playerId}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  i === 0
                    ? "border-amber-700/50 bg-amber-950/20"
                    : i === 1
                      ? "border-slate-600/50 bg-slate-900/20"
                      : i === 2
                        ? "border-orange-900/50 bg-orange-950/10"
                        : "border-slate-800 bg-black/20"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-typewriter border ${
                    i === 0
                      ? "bg-amber-500/20 border-amber-600/50"
                      : i === 1
                        ? "bg-slate-500/20 border-slate-600/50"
                        : i === 2
                          ? "bg-orange-500/20 border-orange-600/50"
                          : "bg-slate-800 border-slate-700"
                  } ${positionColor(i)}`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm font-medium truncate block">
                    {r.nickname}
                  </span>
                  <span className="text-slate-600 text-xs font-typewriter">
                    {r.roundsPlayed}{" "}
                    {r.roundsPlayed === 1 ? "runda" : r.roundsPlayed < 5 ? "rundy" : "rund"}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold font-typewriter ${positionColor(i)}`}>
                    {r.totalScore}
                  </span>
                  <p className="text-slate-600 text-xs">pkt</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Host lobby view */}
      {isHost && (
        <>
          {/* QR Code and sharing section */}
          <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-primary/20">
            <SectionHeader>Kod sesji — udostępnij graczom</SectionHeader>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="font-typewriter text-2xl font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(218,11,11,0.3)]">
                {gameCode}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-typewriter uppercase tracking-wider transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Skopiowano" : "Kopiuj"}
              </button>
            </div>
            <button
              onClick={() =>
                navigator.share
                  ? navigator
                      .share({
                        title: "Dołącz do Mafii!",
                        text: `Dołącz do gry Mafia! Kod: ${gameCode}`,
                        url: joinUrl,
                      })
                      .catch(() => {})
                  : (navigator.clipboard.writeText(joinUrl),
                    setCopied(true),
                    setTimeout(() => setCopied(false), 2000))
              }
              className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-sm font-typewriter uppercase tracking-wider transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Udostępnij link
            </button>
            <div className="flex flex-col items-center gap-2 pt-3 border-t border-slate-800 mt-3">
              <p className="text-slate-600 text-xs font-typewriter uppercase tracking-widest mb-1">
                Zeskanuj aby dołączyć
              </p>
              <div className="p-3 bg-white rounded-xl">
                <QRCode value={joinUrl} size={160} bgColor="#ffffff" fgColor="#1a0c0c" />
              </div>
              <p className="text-slate-700 text-[10px] font-typewriter text-center mt-1 break-all px-2">
                {joinUrl}
              </p>
            </div>
          </div>

          {/* Start button section */}
          <div className="mx-5 mt-6 flex flex-col gap-3">
            {nonHostPlayers.length < (gameMode === "simple" ? 3 : 5) && (
              <p className="text-slate-500 text-sm font-typewriter text-center">
                Potrzeba minimum {gameMode === "simple" ? 3 : 5} graczy ({nonHostPlayers.length}/
                {gameMode === "simple" ? 3 : 5})
              </p>
            )}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-700">
              <SectionHeader className="text-slate-400">Tryb gry</SectionHeader>
              <div className="flex gap-2">
                {(["full", "simple"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-typewriter border transition-all text-center ${gameMode === mode ? "bg-primary/20 border-primary/50 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    <span className="block font-bold">
                      {mode === "full" ? "Pełny" : "Uproszczony"}
                    </span>
                    <span className="block text-xs opacity-60 mt-0.5">
                      {mode === "full" ? "Mafia + Policjant + Lekarz" : "Mafia vs Cywile"}
                    </span>
                    <span className="block text-xs opacity-40">
                      min. {mode === "full" ? 5 : 3} graczy
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {nonHostPlayers.length >= (gameMode === "simple" ? 3 : 5) && (
              <div className="p-4 rounded-xl bg-black/40 border border-slate-700">
                <SectionHeader className="text-slate-400">Liczba mafii</SectionHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMafiaCount(0)}
                    className={`px-3 py-2 rounded-lg text-sm font-typewriter uppercase tracking-wider border transition-all ${mafiaCount === 0 ? "bg-primary/20 border-primary/50 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    Auto (
                    {nonHostPlayers.length <= 5
                      ? 1
                      : nonHostPlayers.length <= 8
                        ? 2
                        : nonHostPlayers.length <= 11
                          ? 3
                          : 4}
                    )
                  </button>
                  {Array.from(
                    { length: Math.max(1, nonHostPlayers.length - 3) },
                    (_, i) => i + 1
                  ).map((n) => (
                    <button
                      key={n}
                      onClick={() => setMafiaCount(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold font-typewriter border transition-all ${mafiaCount === n ? "bg-primary/20 border-primary/50 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-slate-600 text-xs mt-2">
                  {gameMode === "full" ? "+ 1 policjant, 1 lekarz, reszta cywile" : "reszta cywile"}
                </p>
              </div>
            )}
            <button
              onClick={onStart}
              disabled={starting || nonHostPlayers.length < (gameMode === "simple" ? 3 : 5)}
              className="flex w-full items-center justify-center rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-typewriter uppercase tracking-wider"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
            <LobbyTransferGm players={nonHostPlayers} onTransfer={onTransferGm} />
          </div>
        </>
      )}

      {/* Guest lobby view */}
      {!isHost && (
        <InfoCard
          icon="hourglass_empty"
          iconClassName="text-[36px] text-primary/60 mb-2 animate-pulse"
          title="Czekaj na start"
          titleClassName="text-sm text-slate-400"
          description="Mistrz gry niedługo rozpocznie rozgrywkę"
          className="mx-5 mt-5 p-5"
        />
      )}
    </>
  );
}

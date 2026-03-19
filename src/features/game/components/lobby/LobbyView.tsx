"use client";

import QRCode from "react-qr-code";
import type { PublicPlayer } from "@/db";
import LobbyTransferGm from "@/features/game/components/lobby/LobbyTransferGm";
import { SectionHeader, InfoCard } from "@/components/ui";
import {
  autoMafiaCount,
  MIN_PLAYERS_FULL,
  MIN_PLAYERS_SIMPLE,
  COPY_FEEDBACK_MS,
} from "@/lib/constants";

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
}: LobbyViewProps) {
  const minPlayers = gameMode === "full" ? MIN_PLAYERS_FULL : MIN_PLAYERS_SIMPLE;

  return (
    <>
      {/* Host lobby view */}
      {isHost && (
        <>
          {/* QR Code and sharing section */}
          <div className="mx-5 mt-5 p-4 bg-surface-low border border-surface-highest">
            <SectionHeader>PARAMETRY MISJI — udostępnij graczom</SectionHeader>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="font-display text-2xl font-bold text-on-surface tracking-widest drop-shadow-[0_0_8px_rgba(255,180,172,0.3)]">
                {gameCode}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-2 bg-stamp/10 hover:bg-stamp/20 border border-stamp/30 text-stamp text-sm font-display uppercase tracking-wider transition-all"
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
                    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS))
              }
              className="w-full flex items-center justify-center gap-2 h-11 bg-surface-lowest hover:bg-surface-low border border-surface-highest text-on-surface-dim hover:text-on-surface text-sm font-display uppercase tracking-wider transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Udostępnij link
            </button>
            <div className="flex flex-col items-center gap-2 pt-3 border-t border-surface-highest mt-3">
              <p className="text-on-surface-dim text-xs font-display uppercase tracking-widest mb-1">
                Zeskanuj aby dołączyć
              </p>
              <div className="p-3 bg-secondary">
                <QRCode value={joinUrl} size={160} bgColor="#d7c3b0" fgColor="#1a1a1a" />
              </div>
              <p className="text-on-surface-dim text-[10px] font-display text-center mt-1 break-all px-2">
                {joinUrl}
              </p>
            </div>
          </div>

          {/* Start button section */}
          <div className="mx-5 mt-6 flex flex-col gap-3">
            {nonHostPlayers.length < minPlayers && (
              <p className="text-on-surface-dim text-sm font-display text-center">
                Potrzeba minimum {minPlayers} graczy ({nonHostPlayers.length}/{minPlayers})
              </p>
            )}
            <div className="p-4 bg-surface-low border border-surface-highest">
              <SectionHeader className="text-on-surface-dim">Tryb gry</SectionHeader>
              <div className="flex gap-2">
                {(["full", "simple"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`flex-1 px-3 py-2.5 text-sm font-display border transition-all text-center ${gameMode === mode ? "bg-stamp/20 border-stamp/50 text-stamp" : "border-surface-highest text-on-surface-dim hover:border-on-surface-dim"}`}
                  >
                    <span className="block font-bold">
                      {mode === "full" ? "Pełny" : "Uproszczony"}
                    </span>
                    <span className="block text-xs opacity-60 mt-0.5">
                      {mode === "full" ? "Mafia + Policjant + Lekarz" : "Mafia vs Cywile"}
                    </span>
                    <span className="block text-xs opacity-40">
                      min. {mode === "full" ? MIN_PLAYERS_FULL : MIN_PLAYERS_SIMPLE} graczy
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {nonHostPlayers.length >= minPlayers && (
              <div className="p-4 bg-surface-low border border-surface-highest">
                <SectionHeader className="text-on-surface-dim">Liczba mafii</SectionHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMafiaCount(0)}
                    className={`px-3 py-2 text-sm font-display uppercase tracking-wider border transition-all ${mafiaCount === 0 ? "bg-stamp/20 border-stamp/50 text-stamp" : "border-surface-highest text-on-surface-dim hover:border-on-surface-dim"}`}
                  >
                    Auto ({autoMafiaCount(nonHostPlayers.length)})
                  </button>
                  {Array.from(
                    { length: Math.max(1, nonHostPlayers.length - 3) },
                    (_, i) => i + 1
                  ).map((n) => (
                    <button
                      key={n}
                      onClick={() => setMafiaCount(n)}
                      className={`w-10 h-10 text-sm font-bold font-display border transition-all ${mafiaCount === n ? "bg-stamp/20 border-stamp/50 text-stamp" : "border-surface-highest text-on-surface-dim hover:border-on-surface-dim"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-on-surface-dim text-xs mt-2">
                  {gameMode === "full" ? "+ 1 policjant, 1 lekarz, reszta cywile" : "reszta cywile"}
                </p>
              </div>
            )}
            <button
              onClick={onStart}
              disabled={starting || nonHostPlayers.length < minPlayers}
              className="flex w-full items-center justify-center h-14 bg-stamp hover:bg-stamp-dark text-on-paper text-lg font-bold transition-all shadow-[0_4px_14px_0_rgba(255,180,172,0.39)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-display uppercase tracking-wider"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
            <div className="mt-4 pt-4 border-t border-surface-highest">
              <LobbyTransferGm players={nonHostPlayers} onTransfer={onTransferGm} />
            </div>
          </div>
        </>
      )}

      {/* Guest lobby view */}
      {!isHost && (
        <InfoCard
          icon="hourglass_empty"
          iconClassName="text-[36px] text-stamp/60 mb-2 animate-pulse"
          title="Czekaj na start"
          titleClassName="text-sm text-on-surface-dim"
          description="Mistrz gry niedługo rozpocznie rozgrywkę"
          className="mx-5 mt-5 p-5"
        />
      )}
    </>
  );
}

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
          <div
            className="mx-5 mt-5 p-4 card-lifted crt-monitor relative"
            style={{
              background:
                "linear-gradient(155deg, #3D4D3D 0%, #6B7D62 35%, #8FA085 55%, #5A6A52 80%, #3D4D3D 100%)",
            }}
          >
            <SectionHeader
              className="relative z-10"
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
                color: "#A0B89A",
                padding: "4px 8px",
                marginBottom: "12px",
              }}
            >
              PARAMETRY MISJI — udostępnij graczom
            </SectionHeader>
            <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
              <span className="font-display text-2xl font-bold text-stamp-green tracking-widest drop-shadow-[0_0_8px_rgba(122,184,122,0.4)] font-mono">
                {gameCode}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-2 bg-stamp-green/10 hover:bg-stamp-green/20 border border-stamp-green/30 text-stamp-green text-sm font-display uppercase tracking-wider transition-all"
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
              className="w-full flex items-center justify-center gap-2 h-11 bg-accent-green hover:bg-accent-green-bright border border-stamp-green/30 text-stamp-green hover:text-stamp-green text-sm font-display uppercase tracking-wider transition-all relative z-10"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Udostępnij link
            </button>

            {/* Small QR code in bottom-right */}
            <div className="absolute bottom-4 right-4 z-10" style={{ maxWidth: "80px" }}>
              <div className="p-1 bg-paper border border-stamp-green/30">
                <QRCode value={joinUrl} size={48} bgColor="#d7c3b0" fgColor="#1a1a1a" />
              </div>
            </div>
          </div>

          {/* Start button section */}
          <div className="mx-5 mt-6 flex flex-col gap-3">
            {nonHostPlayers.length < minPlayers && (
              <p className="text-on-surface-dim text-sm font-display text-center">
                Potrzeba minimum {minPlayers} graczy ({nonHostPlayers.length}/{minPlayers})
              </p>
            )}
            <div
              className="p-4 card-lifted crt-monitor"
              style={{
                background:
                  "linear-gradient(155deg, #3D4D3D 0%, #6B7D62 35%, #8FA085 55%, #5A6A52 80%, #3D4D3D 100%)",
              }}
            >
              <SectionHeader
                className="relative z-10"
                style={{
                  backgroundColor: "rgba(0,0,0,0.45)",
                  color: "#A0B89A",
                  padding: "4px 8px",
                  marginBottom: "12px",
                }}
              >
                Tryb gry
              </SectionHeader>
              <div className="flex gap-2">
                {(["full", "simple"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`flex-1 px-3 py-2.5 text-sm font-display font-bold border transition-all text-center uppercase tracking-wider ${
                      gameMode === mode
                        ? "bg-[rgba(255,180,172,0.15)] border-[#F0B8AE] text-[#F0B8AE]"
                        : "bg-transparent border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.5)]"
                    }`}
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
              <div
                className="p-4 card-lifted crt-monitor"
                style={{
                  background:
                    "linear-gradient(155deg, #3D4D3D 0%, #6B7D62 35%, #8FA085 55%, #5A6A52 80%, #3D4D3D 100%)",
                }}
              >
                <SectionHeader
                  className="relative z-10"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.45)",
                    color: "#A0B89A",
                    padding: "4px 8px",
                    marginBottom: "12px",
                  }}
                >
                  Liczba mafii
                </SectionHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMafiaCount(0)}
                    className={`px-3 py-2 text-sm font-display uppercase tracking-wider border transition-all ${mafiaCount === 0 ? "bg-stamp-green/20 border-stamp-green/50 text-stamp-green" : "border-stamp-green/30 text-stamp-green/60 hover:border-stamp-green/50"}`}
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
                      className={`w-10 h-10 text-sm font-bold font-display border transition-all ${mafiaCount === n ? "bg-stamp-green/20 border-stamp-green/50 text-stamp-green" : "border-stamp-green/30 text-stamp-green/60 hover:border-stamp-green/50"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-stamp-green/70 text-xs mt-2 font-mono">
                  {gameMode === "full" ? "+ 1 policjant, 1 lekarz, reszta cywile" : "reszta cywile"}
                </p>
              </div>
            )}
            <button
              onClick={onStart}
              disabled={starting || nonHostPlayers.length < minPlayers}
              className="flex w-full items-center justify-center h-14 text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-display uppercase tracking-wider"
              style={{
                backgroundColor: "#C94A42",
                color: "white",
              }}
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
            <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-surface/30 text-center">
              AUTORYZACJA WYMAGANA
            </p>
            <div className="mt-4 pt-4 border-t border-surface-highest">
              <LobbyTransferGm players={nonHostPlayers} onTransfer={onTransferGm} />
            </div>
            <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-surface/40 text-center mt-2">
              OP: MAFIA_HELPER // V.3.0.1
            </p>
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

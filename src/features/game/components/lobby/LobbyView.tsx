"use client";

import QRCode from "react-qr-code";
import type { PublicPlayer } from "@/db";
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
  secretVoting: boolean;
  setSecretVoting: (secretVoting: boolean) => void;
  starting: boolean;
  onStart: () => void;
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
  secretVoting,
  setSecretVoting,
  starting,
  onStart,
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
                backgroundColor: "rgba(0,0,0,0.65)",
                color: "#E8F5E0",
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

            {/* QR code — full width dossier document */}
            <div
              className="mt-4 p-4 relative z-10"
              style={{
                background: "linear-gradient(135deg, #d7c3b0 0%, #c4af9d 50%, #b89e8a 100%)",
                boxShadow: "2px 3px 8px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.05)",
              }}
            >
              {/* Tape effect top */}
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none z-20"
                style={{
                  width: "56px",
                  height: "14px",
                  background:
                    "linear-gradient(180deg, rgba(215,195,176,0.5) 0%, rgba(215,195,176,0.35) 100%)",
                  transform: "translateX(-50%) rotate(-1deg)",
                }}
              />
              <div className="flex justify-center">
                <QRCode
                  value={joinUrl}
                  size={180}
                  bgColor="#d7c3b0"
                  fgColor="#1a1a1a"
                  style={{ width: "100%", height: "auto", maxWidth: "180px" }}
                />
              </div>
              <p
                className="font-display text-[9px] uppercase tracking-[0.2em] text-center mt-3"
                style={{ color: "#5A5A4A" }}
              >
                SKANUJ ABY DOŁĄCZYĆ // KOD: {gameCode}
              </p>
            </div>
          </div>

          {/* Start button section */}
          <div className="mx-5 mt-6 flex flex-col gap-3">
            {nonHostPlayers.length < minPlayers && (
              <p className="text-white/70 text-sm font-display text-center">
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
                  backgroundColor: "rgba(0,0,0,0.65)",
                  color: "#E8F5E0",
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
                    className={`flex-1 px-3 py-2.5 text-sm font-display font-bold border-2 transition-all text-center uppercase tracking-wider ${
                      gameMode === mode
                        ? "bg-[rgba(255,180,172,0.25)] border-[#F0B8AE] text-[#F0B8AE] shadow-[0_0_12px_rgba(240,184,174,0.2)]"
                        : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,0.88)] hover:border-[rgba(255,255,255,0.5)]"
                    }`}
                  >
                    <span className="block font-bold">
                      {mode === "full" ? "Pełny" : "Uproszczony"}
                    </span>
                    <span className="block text-xs opacity-75 mt-0.5">
                      {mode === "full" ? "Mafia + Policjant + Lekarz" : "Mafia vs Cywile"}
                    </span>
                    <span className="block text-xs opacity-70">
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
                    backgroundColor: "rgba(0,0,0,0.65)",
                    color: "#E8F5E0",
                    padding: "4px 8px",
                    marginBottom: "12px",
                  }}
                >
                  Liczba mafii
                </SectionHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMafiaCount(0)}
                    className={`px-3 py-2 text-sm font-display uppercase tracking-wider border-2 transition-all ${mafiaCount === 0 ? "bg-stamp-green/30 border-stamp-green text-white shadow-[0_0_10px_rgba(122,184,122,0.3)]" : "border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"}`}
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
                      className={`w-10 h-10 text-sm font-bold font-display border-2 transition-all ${mafiaCount === n ? "bg-stamp-green/30 border-stamp-green text-white shadow-[0_0_10px_rgba(122,184,122,0.3)]" : "border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-white/80 text-xs mt-2 font-mono">
                  {gameMode === "full" ? "+ 1 policjant, 1 lekarz, reszta cywile" : "reszta cywile"}
                </p>
              </div>
            )}
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
                    backgroundColor: "rgba(0,0,0,0.65)",
                    color: "#E8F5E0",
                    padding: "4px 8px",
                    marginBottom: "12px",
                  }}
                >
                  Ustawienia głosowania
                </SectionHeader>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSecretVoting(!secretVoting)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-display uppercase tracking-wider border-2 transition-all ${
                      secretVoting
                        ? "bg-stamp-green/30 border-stamp-green text-white shadow-[0_0_10px_rgba(122,184,122,0.3)]"
                        : "border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${secretVoting ? "text-white" : "text-white/60"}`}
                    >
                      {secretVoting ? "visibility_off" : "visibility"}
                    </span>
                    Tajne głosowanie
                  </button>
                </div>
                <p className="text-white/80 text-xs mt-2 font-mono">
                  {secretVoting
                    ? "Głosy będą ukryte do końca fazy"
                    : "Głosy widoczne na żywo dla wszystkich"}
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
            <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-surface/60 text-center mt-2">
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

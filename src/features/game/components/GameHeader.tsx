"use client";

import { useState, useCallback } from "react";
import { PHASE_LABELS } from "@/lib/constants";
import PhaseTimer from "@/features/game/components/shared/PhaseTimer";

interface GameHeaderProps {
  phase: string;
  round: number;
  isHost: boolean;
  gameCode?: string;
  currentPlayer: {
    character?: {
      id: string;
      slug: string;
      namePl: string;
      avatarUrl: string;
    } | null;
  };
  onShowSettings: () => void;
}

export default function GameHeader({
  phase,
  round,
  isHost,
  gameCode,
  currentPlayer,
  onShowSettings,
}: GameHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <div
      className="relative z-20 flex items-center justify-between px-4 py-2 border-b border-surface-highest"
      style={{ backgroundColor: "rgba(28, 28, 28, 0.95)" }}
    >
      {/* Left: spacer for balance */}
      <div className="w-8" />

      {/* Center: Faza + Runda + Kod sesji + Timer */}
      <div className="flex-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-display font-black uppercase tracking-widest">
          <span className={isHost ? "text-primary" : "text-on-surface/60"}>
            {isHost ? "MG" : (PHASE_LABELS[phase] ?? phase)}
          </span>
          {round > 0 && <span className="text-on-surface/40">·</span>}
          {round > 0 && <span className="text-on-surface/60">R{round}</span>}
          {gameCode && <span className="text-on-surface/40">·</span>}
          {gameCode && <span className="text-primary tracking-[0.2em]">{gameCode}</span>}
          <PhaseTimer />
        </div>
      </div>

      {/* Right: Settings/avatar button */}
      {isHost ? (
        <button
          onClick={onShowSettings}
          className="w-8 h-8 border border-surface-highest hover:border-on-surface/40 bg-surface-highest/20 flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-on-surface/40">settings</span>
        </button>
      ) : currentPlayer.character ? (
        <button
          onClick={onShowSettings}
          className="w-8 h-8 border border-surface-highest hover:border-on-surface/40 transition-colors overflow-hidden flex items-center justify-center"
        >
          {currentPlayer.character.avatarUrl && !imgError ? (
            <img
              src={currentPlayer.character.avatarUrl}
              alt={currentPlayer.character.namePl}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              onError={handleImgError}
            />
          ) : (
            <span className="font-display font-black text-xs text-on-surface/60">
              {currentPlayer.character.namePl.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={onShowSettings}
          className="w-8 h-8 border border-surface-highest hover:border-on-surface/40 transition-colors bg-surface-highest/20 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[16px] text-on-surface/40">person</span>
        </button>
      )}
    </div>
  );
}

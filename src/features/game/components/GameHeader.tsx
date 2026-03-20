"use client";

import { useState, useCallback } from "react";
import { PHASE_LABELS } from "@/lib/constants";

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
  onShowGmPanel?: () => void;
}

export default function GameHeader({
  phase,
  round,
  isHost,
  gameCode,
  currentPlayer,
  onShowSettings,
  onShowGmPanel,
}: GameHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <div
      className="relative z-20 flex items-center justify-between px-4 py-2.5 border-b border-surface-highest"
      style={{ backgroundColor: "rgba(28, 28, 28, 0.95)" }}
    >
      {/* Left: GM Panel button (only for host) OR empty spacer */}
      <div className="flex items-center">
        {isHost && onShowGmPanel ? (
          <button
            onClick={onShowGmPanel}
            className="flex items-center gap-1.5 px-2 py-1 border border-primary/60 hover:border-primary bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">star</span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-primary">
              GM
            </span>
          </button>
        ) : (
          <div className="w-12" /> // Spacer for alignment
        )}
      </div>

      {/* Center: Faza + Runda + Kod sesji (jedna linia kompaktowa) */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center gap-1.5 text-xs font-display font-black uppercase tracking-widest">
          {/* Phase */}
          <span className="text-on-surface/60">{PHASE_LABELS[phase] ?? phase}</span>

          {/* Dot separator */}
          {round > 0 && <span className="text-on-surface/40">·</span>}

          {/* Round */}
          {round > 0 && <span className="text-on-surface/60">R{round}</span>}

          {/* Dot separator */}
          {gameCode && <span className="text-on-surface/40">·</span>}

          {/* Game code */}
          {gameCode && <span className="text-primary tracking-[0.2em]">KOD:{gameCode}</span>}
        </div>
      </div>

      {/* Right: Settings/avatar button */}
      <div className="flex items-center justify-center">
        {isHost ? (
          <button
            onClick={onShowSettings}
            className="w-8 h-8 border border-surface-highest hover:border-on-surface/40 bg-surface-highest/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface/40">
              settings
            </span>
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
    </div>
  );
}

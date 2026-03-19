"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PHASE_LABELS } from "@/lib/constants";

interface GameHeaderProps {
  phase: string;
  round: number;
  gameCode: string;
  isHost: boolean;
  currentPlayer: {
    character?: {
      id: string;
      slug: string;
      namePl: string;
      avatarUrl: string;
    } | null;
  };
  onShowSettings: () => void;
  onShowRanking: () => void;
  onShowGMPanel: () => void;
}

export default function GameHeader({
  phase,
  round,
  gameCode,
  isHost,
  currentPlayer,
  onShowSettings,
  onShowRanking,
  onShowGMPanel,
}: GameHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <div className="relative z-10 flex items-center justify-between px-3 py-2 border-b border-on-surface/10 bg-surface-low">
      {/* Left: back + ranking */}
      <div className="flex items-center gap-0.5">
        <Link
          href="/"
          className="size-9 flex items-center justify-center text-on-surface/35 hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </Link>
        <button
          onClick={onShowRanking}
          className="size-9 flex items-center justify-center text-on-surface/35 hover:text-on-surface"
          title="Ranking sesji"
        >
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
        </button>
      </div>

      {/* Center: code + phase + TAJNE badge */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-on-surface tracking-widest text-sm">
            {gameCode}
          </span>
          <span className="stamp stamp-red text-[9px] py-0 px-1">TAJNE</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="font-display text-on-surface/40 uppercase tracking-widest text-[10px]">
            {PHASE_LABELS[phase] ?? phase}
          </p>
          {round > 0 && <p className="text-on-surface/25 text-[10px] font-display">· R{round}</p>}
        </div>
      </div>

      {/* Right: avatar + GM trigger */}
      <div className="flex items-center gap-0.5">
        {isHost && (
          <button
            onClick={onShowGMPanel}
            className="size-9 flex items-center justify-center text-stamp hover:text-stamp/80"
            title="Panel Mistrza Gry"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          </button>
        )}

        {/* Avatar / settings button */}
        <button
          onClick={onShowSettings}
          className="size-9 flex items-center justify-center"
          title="Ustawienia"
        >
          {currentPlayer.character && !imgError ? (
            <div className="w-7 h-7 border border-on-surface/20 overflow-hidden">
              <img
                src={currentPlayer.character.avatarUrl}
                alt={currentPlayer.character.namePl}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={handleImgError}
              />
            </div>
          ) : (
            <span className="material-symbols-outlined text-[20px] text-on-surface/40 hover:text-on-surface">
              person
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

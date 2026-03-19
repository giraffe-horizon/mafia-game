import { useState, useCallback } from "react";
import Link from "next/link";
import { PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";
import { Stamp } from "@/components/ui";

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
  onShowRanking: () => void;
  onShowGmPanel?: () => void;
}

export default function GameHeader({
  phase,
  round,
  isHost,
  gameCode,
  currentPlayer,
  onShowSettings,
  onShowRanking,
  onShowGmPanel,
}: GameHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <div className="relative z-20 flex items-center justify-between px-4 py-2.5 border-b border-surface-highest bg-surface-low">
      {/* Left: Back + Ranking + folder */}
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="size-9 flex items-center justify-center text-on-surface/30 hover:text-on-surface/60 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </Link>
        <button
          onClick={onShowRanking}
          className="size-9 flex items-center justify-center text-on-surface/30 hover:text-on-surface/60 transition-colors"
          title="Ranking sesji"
        >
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
        </button>
        <span className="material-symbols-outlined text-[18px] text-on-surface/20">folder</span>
      </div>

      {/* Center: Phase + Round + Session code */}
      <div className="text-center">
        {isHost ? (
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-primary">star</span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-primary">
              Mistrz Gry
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-on-surface/40">
              {PHASE_ICONS[phase] ?? "radio_button_unchecked"}
            </span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
              {PHASE_LABELS[phase] ?? phase}
            </span>
          </div>
        )}
        {gameCode && (
          <p className="font-display text-[9px] text-on-surface/30 uppercase tracking-[0.15em]">
            KOD: <span className="text-stamp/60">{gameCode}</span>
          </p>
        )}
        {round > 0 && (
          <p className="font-display text-[10px] text-on-surface/30 uppercase tracking-widest">
            Runda {round}
          </p>
        )}
      </div>

      {/* Right: STATUS stamp + Settings + GM Panel */}
      <div className="flex items-center gap-1">
        <Stamp color="red" rotate={-4} className="text-[7px] px-1 py-0 hidden sm:inline-block">
          TAJNE
        </Stamp>
        {isHost && onShowGmPanel && (
          <button
            onClick={onShowGmPanel}
            className="w-8 h-8 border border-primary/60 hover:border-primary bg-primary/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">star</span>
          </button>
        )}
        <div className="size-9 flex items-center justify-center">
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
              <span className="material-symbols-outlined text-[16px] text-on-surface/30">
                person
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

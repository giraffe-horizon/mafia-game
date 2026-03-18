import Link from "next/link";
import { PHASE_LABELS } from "@/lib/constants";

interface GameHeaderProps {
  token: string;
  phase: string;
  round: number;
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
}

export default function GameHeader({
  token,
  phase,
  round,
  isHost,
  currentPlayer,
  onShowSettings,
}: GameHeaderProps) {
  return (
    <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800">
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="size-9 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <Link
          href={`/ranking?token=${token}`}
          className="size-9 flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors"
          title="Ranking sesji"
        >
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
        </Link>
      </div>
      <div className="text-center">
        <h2 className="font-typewriter text-white text-sm font-semibold">{PHASE_LABELS[phase]}</h2>
        {round > 0 && <p className="text-slate-500 text-xs font-typewriter">Runda {round}</p>}
      </div>
      <div className="size-9 flex items-center justify-center">
        {isHost ? (
          <button
            onClick={onShowSettings}
            className="w-8 h-8 rounded-full border-2 border-primary/50 hover:border-primary transition-colors bg-primary/10 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              manage_accounts
            </span>
          </button>
        ) : currentPlayer.character ? (
          <button
            onClick={onShowSettings}
            className="w-8 h-8 rounded-full border-2 border-slate-600 hover:border-slate-400 transition-colors overflow-hidden flex items-center justify-center"
          >
            {currentPlayer.character.avatarUrl ? (
              <>
                <img
                  src={currentPlayer.character.avatarUrl}
                  alt={currentPlayer.character.namePl}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = "none";
                    const ph = t.parentElement?.querySelector(".header-placeholder");
                    if (ph) (ph as HTMLElement).style.display = "flex";
                  }}
                />
                <div className="header-placeholder hidden w-full h-full bg-primary/20 text-primary font-bold items-center justify-center text-xs">
                  {currentPlayer.character.namePl.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                {currentPlayer.character.namePl.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={onShowSettings}
            className="w-8 h-8 rounded-full border-2 border-slate-600 hover:border-slate-400 transition-colors bg-slate-800 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
          </button>
        )}
      </div>
    </div>
  );
}

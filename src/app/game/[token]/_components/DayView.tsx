import { useState } from "react";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";
import { useGameStore } from "../_stores/gameStore";

interface DetectiveResult {
  round: number;
  targetNickname: string;
  isMafia: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DayViewProps {}

export default function DayView(_props: DayViewProps = {} as DayViewProps) {
  // Get data from store
  const state = useGameStore((s) => s.state);
  const [roleVisible, setRoleVisible] = useState(false);

  if (!state) return null;

  const isHost = state.currentPlayer.isHost;
  const currentPlayer = state.currentPlayer;
  const phase = state.game.phase;

  // Find detective result from game state (TODO: implement proper detective result tracking)
  // const detectiveResult: DetectiveResult | undefined = state.game.phase === "day" ? undefined : undefined;
  return (
    <>
      {/* Role card for non-host players */}
      {!isHost && (
        <div className="mx-5 mt-5">
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
            Twoja rola
          </p>
          <button
            onClick={() => setRoleVisible((v) => !v)}
            className="w-full p-5 rounded-xl bg-black/60 border border-primary/20 hover:border-primary/40 transition-all active:scale-[0.98]"
          >
            {roleVisible ? (
              <div className="flex items-center gap-4">
                <span
                  className={`material-symbols-outlined text-[48px] ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                >
                  {ROLE_ICONS[currentPlayer.role ?? "civilian"]}
                </span>
                <div className="text-left">
                  <p
                    className={`font-typewriter text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                  >
                    {ROLE_LABELS[currentPlayer.role ?? "civilian"]}
                  </p>
                  {currentPlayer.role === "mafia" && (
                    <p className="text-red-400/70 text-xs font-typewriter mt-1">
                      🔴 Twoi wspólnicy są oznaczeni na liście
                    </p>
                  )}
                  <p className="text-slate-500 text-sm mt-1">Stuknij aby ukryć</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2">
                <span className="material-symbols-outlined text-[32px] text-slate-600">
                  visibility_off
                </span>
                <p className="font-typewriter text-slate-500 uppercase tracking-widest text-sm">
                  Stuknij aby zobaczyć rolę
                </p>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Phase indicator for host */}
      {isHost && (
        <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-slate-700 flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">
            {PHASE_ICONS[phase]}
          </span>
          <div>
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
              Faza gry
            </p>
            <p className="font-typewriter text-xl font-bold text-white uppercase tracking-wider">
              {PHASE_LABELS[phase]}
            </p>
          </div>
        </div>
      )}

      {/* Detective result - TODO: implement proper detective result tracking
      {detectiveResult && !isHost && (
        <div className="mx-5 mt-4 p-4 rounded-xl bg-blue-950/30 border border-blue-800/40">
          <p className="text-blue-400 text-xs font-typewriter uppercase tracking-widest mb-2">
            Wynik przesłuchania — Runda {detectiveResult?.round}
          </p>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-blue-400">search</span>
            <div>
              <p className="text-white font-medium">{detectiveResult?.targetNickname}</p>
              <p
                className={`text-sm font-typewriter font-bold ${detectiveResult?.isMafia ? "text-red-400" : "text-green-400"}`}
              >
                {detectiveResult?.isMafia ? "MAFIA" : "NIE MAFIA"}
              </p>
            </div>
          </div>
        </div>
      )}
      */}

      {/* Day message for non-host players */}
      {!isHost && (
        <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
          <span className="material-symbols-outlined text-[28px] text-yellow-500/60 mb-1 block">
            wb_sunny
          </span>
          <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
            Dzień — dyskutujcie i szukajcie mafii
          </p>
        </div>
      )}
    </>
  );
}

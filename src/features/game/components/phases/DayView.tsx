import type { GameStateResponse, PublicPlayer, GamePhase } from "@/db";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import RoleCard from "@/features/game/components/shared/RoleCard";
import PhaseIndicator from "@/features/game/components/shared/PhaseIndicator";
import { Stamp } from "@/components/ui";
import { useMemo } from "react";

interface DayViewProps {
  isHost: boolean;
  currentPlayer: GameStateResponse["currentPlayer"];
  players: PublicPlayer[];
  phase: GamePhase;
  round: number;
  roleVisible: boolean;
  toggleRole: () => void;
  detectiveResult?: GameStateResponse["detectiveResult"];
  lastNightSummary?: GameStateResponse["lastNightSummary"];
}

export default function DayView({
  isHost,
  currentPlayer,
  players,
  phase,
  round,
  roleVisible,
  toggleRole,
  detectiveResult,
  lastNightSummary,
}: DayViewProps) {
  const aliveNonHost = useMemo(() => players.filter((p) => !p.isHost && p.isAlive), [players]);
  const totalAlive = aliveNonHost.length;
  return (
    <div className="bg-background min-h-full">
      {/* Role card for alive non-host players (dead players see all roles via DeadSpectatorView) */}
      {!isHost && currentPlayer.isAlive && (
        <RoleCard
          role={currentPlayer.role || undefined}
          roleVisible={roleVisible}
          onToggle={toggleRole}
        />
      )}

      {/* Phase indicator for host */}
      {isHost && <PhaseIndicator phase={phase} />}

      {/* Detective investigation result — only visible when role is revealed */}
      {!isHost && roleVisible && currentPlayer.role === "detective" && detectiveResult && (
        <div className="mx-4 mt-4">
          <div
            className={`border p-4 ${
              detectiveResult.isMafia
                ? "border-primary/40 bg-surface-lowest"
                : "border-green-900/40 bg-surface-low"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`material-symbols-outlined text-[28px] ${
                  detectiveResult.isMafia ? "text-primary" : "text-green-400"
                }`}
              >
                search
              </span>
              <p className="font-display font-black text-sm uppercase tracking-wide text-on-surface">
                Wynik śledztwa — runda {detectiveResult.round}
              </p>
            </div>
            <p className="font-display text-base text-on-surface mb-3">
              <span className="font-black uppercase tracking-widest">
                {detectiveResult.targetNickname}
              </span>
            </p>
            <Stamp
              color={detectiveResult.isMafia ? "red" : "green"}
              rotate={detectiveResult.isMafia ? -2 : 2}
            >
              {detectiveResult.isMafia ? "Mafia" : "Niewinny"}
            </Stamp>
          </div>
        </div>
      )}

      {/* Day message for alive non-host players */}
      {!isHost && currentPlayer.isAlive && (
        <div className="mx-4 mt-4">
          {/* Main day header */}
          <div className="border border-on-surface/10 bg-surface-lowest/20">
            <div className="border-b border-on-surface/10 px-3 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-amber-400/60">
                wb_sunny
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                Faza dzienna — Runda {round}
              </span>
            </div>
            <div className="p-3 space-y-3">
              {/* Last night summary */}
              {lastNightSummary && (
                <div className="flex items-center justify-between py-2 border-b border-on-surface/10">
                  <span className="font-display text-xs uppercase tracking-widest text-on-surface/50">
                    Wynik nocy:
                  </span>
                  <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface">
                    {lastNightSummary.killedNickname
                      ? `Zginął ${lastNightSummary.killedNickname}`
                      : lastNightSummary.savedByDoctor
                        ? "Lekarz uratował ofiarę"
                        : "Nikt nie zginął"}
                  </span>
                </div>
              )}

              {/* Game status */}
              <div className="flex items-center justify-between">
                <span className="font-display text-xs uppercase tracking-widest text-on-surface/50">
                  Agenci w grze:
                </span>
                <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface">
                  {totalAlive} osób
                </span>
              </div>

              {/* Instructions */}
              <p className="font-display text-xs text-on-surface/60 pt-2 border-t border-on-surface/10">
                Dyskutujcie i szukajcie mafii. Każdy może wypowiedzieć swoje podejrzenia.
              </p>
            </div>
          </div>

          {/* Alive players list */}
          {aliveNonHost.length > 0 && (
            <div className="mt-3 border border-surface-highest bg-surface-highest/5">
              <div className="border-b border-surface-highest px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface/50">
                  group
                </span>
                <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/50">
                  Żywi agenci
                </span>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {aliveNonHost.map((p) => (
                    <div
                      key={p.playerId}
                      className={`px-2 py-1 border border-surface-highest text-xs font-display font-black uppercase tracking-widest ${
                        p.isYou
                          ? "text-amber-400 border-amber-400/40 bg-amber-400/5"
                          : "text-on-surface/70"
                      }`}
                    >
                      {p.nickname}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView
          currentPlayer={{ role: currentPlayer.role || undefined }}
          players={players}
          phase="day"
          round={round}
        />
      )}
    </div>
  );
}

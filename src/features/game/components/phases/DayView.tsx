import type { GameStateResponse, PublicPlayer, GamePhase } from "@/db";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import RoleCard from "@/features/game/components/shared/RoleCard";
import PhaseIndicator from "@/features/game/components/shared/PhaseIndicator";
import { Stamp } from "@/components/ui";

interface DayViewProps {
  isHost: boolean;
  currentPlayer: GameStateResponse["currentPlayer"];
  players: PublicPlayer[];
  phase: GamePhase;
  roleVisible: boolean;
  toggleRole: () => void;
  detectiveResult?: GameStateResponse["detectiveResult"];
}

export default function DayView({
  isHost,
  currentPlayer,
  players,
  phase,
  roleVisible,
  toggleRole,
  detectiveResult,
}: DayViewProps) {
  return (
    <div className="bg-[#1a1000] min-h-full">
      {/* Role card for non-host players */}
      {!isHost && (
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
                ? "border-primary/40 bg-[#1a0505]"
                : "border-green-900/40 bg-[#021002]"
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
        <div className="mx-4 mt-4 border border-on-surface/10 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-amber-400/60">wb_sunny</span>
          <div>
            <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
              Faza dzienna
            </p>
            <p className="font-display text-xs text-on-surface/40 mt-0.5">
              Dyskutujcie i szukajcie mafii
            </p>
          </div>
        </div>
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView
          currentPlayer={{ role: currentPlayer.role || undefined }}
          players={players}
        />
      )}
    </div>
  );
}

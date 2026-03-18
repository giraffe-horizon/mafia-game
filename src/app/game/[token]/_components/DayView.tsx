import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";
import { SectionHeader, Card, InfoCard } from "@/components/ui";
import RoleHidden from "@/components/ui/RoleHidden";
import DeadSpectatorView from "./DeadSpectatorView";
import { useGameStore } from "../_stores/gameStore";

interface DayViewProps {
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
}

export default function DayView({ roleVisible, setRoleVisible }: DayViewProps) {
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const isHost = state.currentPlayer.isHost;
  const currentPlayer = state.currentPlayer;
  const phase = state.game.phase;

  return (
    <>
      {/* Role card for non-host players */}
      {!isHost && (
        <div className="mx-5 mt-5">
          <SectionHeader className="pl-1">Twoja rola</SectionHeader>
          <Card
            variant="highlighted"
            onClick={() => setRoleVisible((v) => !v)}
            className="w-full p-5 cursor-pointer transition-all active:scale-[0.98]"
            role="button"
            tabIndex={0}
            aria-label={roleVisible ? "Ukryj rolę" : "Pokaż rolę"}
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
          </Card>
        </div>
      )}

      {/* Phase indicator for host */}
      {isHost && (
        <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-slate-700 flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">
            {PHASE_ICONS[phase]}
          </span>
          <div>
            <SectionHeader className="mb-0">Faza gry</SectionHeader>
            <p className="font-typewriter text-xl font-bold text-white uppercase tracking-wider">
              {PHASE_LABELS[phase]}
            </p>
          </div>
        </div>
      )}

      {/* Detective investigation result — hidden when role is hidden */}
      {!isHost && currentPlayer.role === "detective" && state.detectiveResult && (
        <RoleHidden
          visible={roleVisible}
          className="mx-5 mt-4"
          hint="Odkryj rolę aby zobaczyć wynik śledztwa"
        >
          <SectionHeader icon="search">Wynik śledztwa</SectionHeader>
          <Card
            className={`p-4 ${
              state.detectiveResult.isMafia
                ? "bg-red-900/30 border-red-700/50"
                : "bg-green-900/30 border-green-700/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[32px] ${
                  state.detectiveResult.isMafia ? "text-red-400" : "text-green-400"
                }`}
              >
                search
              </span>
              <p className="font-typewriter text-lg font-bold tracking-wide">
                {state.detectiveResult.isMafia
                  ? `🔴 ${state.detectiveResult.targetNickname} jest członkiem mafii!`
                  : `🟢 ${state.detectiveResult.targetNickname} jest niewinny`}
              </p>
            </div>
          </Card>
        </RoleHidden>
      )}

      {/* Day message for alive non-host players */}
      {!isHost && currentPlayer.isAlive && (
        <InfoCard
          icon="wb_sunny"
          iconClassName="text-yellow-500/60"
          title="Dzień — dyskutujcie i szukajcie mafii"
          className="mx-5 mt-4"
        />
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView
          currentPlayer={{ role: currentPlayer.role || undefined }}
          players={state.players}
        />
      )}
    </>
  );
}

import { SectionHeader, Card, InfoCard } from "@/components/ui";
import DeadSpectatorView from "@/app/game/[token]/_components/DeadSpectatorView";
import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import RoleCard from "@/app/game/[token]/_components/RoleCard";
import PhaseIndicator from "@/app/game/[token]/_components/PhaseIndicator";

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
        <RoleCard
          role={currentPlayer.role || undefined}
          roleVisible={roleVisible}
          onToggle={() => setRoleVisible((v) => !v)}
        />
      )}

      {/* Phase indicator for host */}
      {isHost && <PhaseIndicator phase={phase} />}

      {/* Detective investigation result — only visible when role is revealed */}
      {!isHost && roleVisible && currentPlayer.role === "detective" && state.detectiveResult && (
        <div className="mx-5 mt-4">
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
        </div>
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

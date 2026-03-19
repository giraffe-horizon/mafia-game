import type { GameStateResponse, PublicPlayer, GamePhase } from "@/db";
import { SectionHeader, Card, InfoCard } from "@/components/ui";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import RoleCard from "@/features/game/components/shared/RoleCard";
import PhaseIndicator from "@/features/game/components/shared/PhaseIndicator";

interface DayViewProps {
  isHost: boolean;
  currentPlayer: GameStateResponse["currentPlayer"];
  players: PublicPlayer[];
  phase: GamePhase;
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  detectiveResult?: GameStateResponse["detectiveResult"];
}

export default function DayView({
  isHost,
  currentPlayer,
  players,
  phase,
  roleVisible,
  setRoleVisible,
  detectiveResult,
}: DayViewProps) {
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
      {!isHost && roleVisible && currentPlayer.role === "detective" && detectiveResult && (
        <div className="mx-5 mt-4">
          <SectionHeader icon="search">Wynik śledztwa</SectionHeader>
          <Card
            className={`p-4 ${
              detectiveResult.isMafia
                ? "bg-red-900/30 border-red-700/50"
                : "bg-green-900/30 border-green-700/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[32px] ${
                  detectiveResult.isMafia ? "text-red-400" : "text-green-400"
                }`}
              >
                search
              </span>
              <p className="font-typewriter text-lg font-bold tracking-wide">
                {detectiveResult.isMafia
                  ? `🔴 ${detectiveResult.targetNickname} jest członkiem mafii!`
                  : `🟢 ${detectiveResult.targetNickname} jest niewinny`}
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
          players={players}
        />
      )}
    </>
  );
}

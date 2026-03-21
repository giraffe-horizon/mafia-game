"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import NightContainer from "@/features/game/containers/NightContainer";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import { Stamp } from "@/components/ui";

export default function NightTab() {
  const { phase, isLobby } = useCurrentPhase();
  const { currentPlayer, players } = usePlayerState();
  const lastNightSummary = useGameStore((s) => s.state?.lastNightSummary);
  const round = useGameStore((s) => s.state?.game?.round ?? 1);

  if (isLobby) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <span className="material-symbols-outlined text-[48px] text-on-surface/40">bedtime</span>
        <p className="font-display text-on-surface/40 text-sm uppercase tracking-widest text-center">
          Gra nie została jeszcze rozpoczęta
        </p>
      </div>
    );
  }

  if (phase === "night") {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-background via-background to-red-950/10">
        <NightContainer />
      </div>
    );
  }

  // Day/Voting/Review/Ended — show last night summary
  if (lastNightSummary) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-2 border-b border-surface-highest pb-3">
          <span className="material-symbols-outlined text-[16px] text-primary">bedtime</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Runda {lastNightSummary.round} — wynik nocy
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          {lastNightSummary.killedNickname ? (
            <>
              <span className="material-symbols-outlined text-[56px] text-primary-dark">skull</span>
              <p className="font-display font-black text-lg text-on-surface uppercase tracking-wide text-center">
                Tej nocy zginął:
              </p>
              <p className="font-display font-black text-2xl text-primary uppercase tracking-widest text-center">
                {lastNightSummary.killedNickname}
              </p>
              <Stamp color="red" rotate={-3}>
                Eliminacja
              </Stamp>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[56px] text-on-surface/40">
                shield_moon
              </span>
              <p className="font-display font-black text-lg text-on-surface uppercase tracking-wide text-center">
                {lastNightSummary.savedByDoctor
                  ? "Lekarz uratował ofiarę!"
                  : "Tej nocy nikt nie zginął"}
              </p>
              <Stamp color="green" rotate={2}>
                Bez ofiar
              </Stamp>
            </>
          )}
        </div>
      </div>
    );
  }

  // Fallback: dead spectator
  if (currentPlayer && !currentPlayer.isAlive) {
    return (
      <div className="flex-1 flex flex-col">
        <DeadSpectatorView
          currentPlayer={{ role: currentPlayer.role || undefined }}
          players={players}
          phase={phase}
          round={round}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
      <span className="material-symbols-outlined text-[48px] text-on-surface/40">bedtime</span>
      <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
        Czekaj na wyniki nocy
      </p>
    </div>
  );
}

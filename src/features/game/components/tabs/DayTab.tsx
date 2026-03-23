"use client";

import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import LobbyContainer from "@/features/game/containers/LobbyContainer";
import DayContainer from "@/features/game/containers/DayContainer";
import VotingContainer from "@/features/game/containers/VotingContainer";
import GMPanelContainer from "@/features/game/containers/GMPanelContainer";
import EndScreen from "@/features/game/components/EndScreen";
import { Stamp } from "@/components/ui";

export default function DayTab() {
  const { phase, isLobby, isFinished } = useCurrentPhase();
  const { isHost } = usePlayerState();

  // Show EndScreen when game is finished
  if (isFinished) {
    return <EndScreen />;
  }

  if (isLobby) {
    return (
      <div className="flex-1 flex flex-col">
        <LobbyContainer />
      </div>
    );
  }

  // GM gets full panel instead of day view
  if (isHost) {
    return (
      <div className="flex-1 flex flex-col">
        <GMPanelContainer />
      </div>
    );
  }

  if (phase === "night") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
          <span className="material-symbols-outlined text-[48px] text-on-surface/40">bedtime</span>
          <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
            Trwa noc...
          </p>
        </div>
      </div>
    );
  }

  // Voting phase — show voting UI
  if (phase === "voting") {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-background via-background to-pink-950/10">
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">how_to_vote</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Głosowanie
          </span>
          <div className="ml-auto">
            <Stamp variant="classified" color="red" rotate={8} className="text-[8px] px-1.5 py-0.5">
              AKTYWNE
            </Stamp>
          </div>
        </div>
        <VotingContainer />
      </div>
    );
  }

  // Day/Review/Ended — regular players
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-background via-background to-amber-950/15">
      <DayContainer />
    </div>
  );
}

"use client";

import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import LobbyContainer from "@/features/game/containers/LobbyContainer";
import DayContainer from "@/features/game/containers/DayContainer";
import GMPanelContainer from "@/features/game/containers/GMPanelContainer";

export default function DayTab() {
  const { phase, isLobby } = useCurrentPhase();
  const { isHost } = usePlayerState();

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

  // Day/Voting/Review/Ended — regular players
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-background via-background to-amber-950/15">
      <DayContainer />
    </div>
  );
}

"use client";

import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import LobbyContainer from "@/features/game/containers/LobbyContainer";
import DayContainer from "@/features/game/containers/DayContainer";
import PlayersListContainer from "@/features/game/containers/PlayersListContainer";

export default function DayTab() {
  const { phase, isLobby } = useCurrentPhase();

  if (isLobby) {
    return (
      <div className="flex-1 flex flex-col">
        <LobbyContainer />
      </div>
    );
  }

  if (phase === "night") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
          <span className="material-symbols-outlined text-[48px] text-on-surface/20">bedtime</span>
          <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
            Trwa noc...
          </p>
        </div>
        <PlayersListContainer />
      </div>
    );
  }

  // Day/Voting/Review/Ended
  return (
    <div className="flex-1 flex flex-col">
      <DayContainer />
      <PlayersListContainer />
    </div>
  );
}

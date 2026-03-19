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
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-on-surface/40">wb_sunny</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40">Dzień</span>
        </div>
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
      <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">wb_sunny</span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">Dzień</span>
      </div>
      <DayContainer />
      <PlayersListContainer />
    </div>
  );
}

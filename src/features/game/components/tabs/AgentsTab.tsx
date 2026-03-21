"use client";

import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { useGameStore } from "@/features/game/store/gameStore";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import PlayersListContainer from "@/features/game/containers/PlayersListContainer";
import MissionsList from "@/features/game/components/players/MissionsList";
import ReviewContainer from "@/features/game/containers/ReviewContainer";
import RankingInline from "@/features/game/components/shared/RankingInline";

export default function AgentsTab() {
  const { isLobby, phase } = useCurrentPhase();
  const { isHost } = usePlayerState();
  const state = useGameStore((s) => s.state);
  const gameLog = useGameStore((s) => s.state?.gameLog);

  // LOBBY: Lista graczy + informacje o sesji
  if (isLobby) {
    if (!state) return null;
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">group</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Agenci
          </span>
        </div>

        {/* Lista graczy z ghost slotami */}
        <PlayersListContainer />

        {/* Informacje o sesji */}
        <div className="p-4">
          <div className="border border-surface-highest p-4">
            <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40 mb-3">
              Informacje o sesji
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs text-on-surface/40 uppercase tracking-widest w-24">
                  Kod sesji:
                </span>
                <span className="font-display font-black text-sm text-primary tracking-[0.3em]">
                  {state.game.code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs text-on-surface/40 uppercase tracking-widest w-24">
                  Status:
                </span>
                <span className="font-display text-xs text-on-surface/60 uppercase tracking-widest">
                  Lobby
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REVIEW phase — show review form
  if (phase === "review") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">group</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Agenci
          </span>
        </div>

        {/* Lista graczy na górze */}
        <PlayersListContainer />

        {/* Review form */}
        <div className="border-t border-surface-highest">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">assignment</span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
              Przegląd misji
            </span>
          </div>
          <ReviewContainer />
        </div>
      </div>
    );
  }

  // ENDED — Pełny ranking + lista graczy z rolami
  if (phase === "ended") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">group</span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Agenci
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pełny ranking na górze */}
          <div className="border-b border-surface-highest">
            <RankingInline />
          </div>

          {/* Lista graczy z odkrytymi rolami */}
          <PlayersListContainer />
        </div>
      </div>
    );
  }

  // W GRZE (night/day/voting): Lista graczy + ranking + logi
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-surface-highest flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">group</span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
          Centrum dowodzenia
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Lista graczy na górze */}
        <div className="border-b border-surface-highest">
          <PlayersListContainer />
        </div>

        {/* Ranking inline pod listą graczy */}
        <div className="border-b border-surface-highest">
          <RankingInline />
        </div>

        {/* LOGI — sekcja z wiadomościami GM + misje + historia */}
        <div className="p-4">
          <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40 mb-4">
            Logi operacyjne
          </p>

          {/* Missions for non-host */}
          {!isHost && state && (
            <div className="mb-4">
              <MissionsList missions={state.missions} showPoints={state.showPoints} />
            </div>
          )}

          {/* GM messages (non-system) */}
          {state && state.messages.filter((m) => !m.eventType).length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40 mb-1">
                Wiadomości od MG
              </p>
              {state.messages
                .filter((m) => !m.eventType)
                .slice()
                .reverse()
                .map((msg) => (
                  <div key={msg.id} className="border border-surface-highest p-3 relative">
                    <div className="absolute -top-1.5 left-3">
                      <span className="font-display font-black text-[9px] uppercase tracking-widest text-on-surface/40 bg-surface-low px-1">
                        Depesza
                      </span>
                    </div>
                    <p className="font-display text-sm text-on-surface/80 mt-1">{msg.content}</p>
                    <p className="font-display text-[10px] text-on-surface/40 mt-1 uppercase tracking-wider">
                      {new Date(msg.createdAt).toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {/* Game log events */}
          {gameLog && gameLog.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40">
                Historia zdarzeń
              </p>
              {gameLog.map((roundData) => (
                <div key={roundData.round} className="border border-surface-highest">
                  <div className="bg-surface-highest/20 px-3 py-2">
                    <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
                      Runda {roundData.round}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {roundData.events.map((event, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="material-symbols-outlined text-[14px] text-on-surface/40 mt-0.5">
                          {event.type === "night_result" ? "bedtime" : "how_to_vote"}
                        </span>
                        <p className="font-display text-on-surface/70">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {(!gameLog || gameLog.length === 0) &&
            state?.messages.filter((m) => !m.eventType).length === 0 &&
            isHost && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <span className="material-symbols-outlined text-[48px] text-on-surface/40">
                  assignment
                </span>
                <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
                  Brak logów
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

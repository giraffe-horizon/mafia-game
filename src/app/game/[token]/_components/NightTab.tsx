"use client";

import { useState } from "react";
import { useGameStore } from "../_stores/gameStore";
import NightActionPanel, { type ActionState, type MafiaState } from "./NightActionPanel";
import DeadSpectatorView from "./DeadSpectatorView";
import { SectionHeader, Card, InfoCard } from "@/components/ui";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import PlayersList from "./PlayersList";
import type { Role } from "@/db/types";

interface NightTabProps {
  actionState: ActionState;
  mafiaState: MafiaState;
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  onKick: (playerId: string) => void;
}

export default function NightTab({ actionState, mafiaState, myAction, onKick }: NightTabProps) {
  const [roleVisible, setRoleVisible] = useState(false);
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const { game, currentPlayer, players, lastNightSummary } = state;

  // Filter action targets (exclude mafia teammates when role is visible)
  const actionTargets = players.filter(
    (p) =>
      p.isAlive &&
      !p.isYou &&
      !p.isHost &&
      !(roleVisible && currentPlayer.role === "mafia" && p.role === "mafia")
  );
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const phase = game.phase;

  // Lobby state: nothing to show in NOC tab
  if (isLobby) {
    return (
      <div className="mx-5 mt-12 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-[52px] text-on-surface/15">bedtime</span>
        <p className="text-on-surface/35 font-display font-bold uppercase tracking-widest text-sm">
          Gra się nie rozpoczęła
        </p>
        <p className="text-on-surface/20 text-xs font-display">
          Przejdź do zakładki DZIEŃ aby zobaczyć lobby
        </p>
      </div>
    );
  }

  // Night phase: role card + action panel or dead spectator
  if (phase === "night") {
    return (
      <>
        {!isHost && (
          <div className="mx-5 mt-5">
            <SectionHeader className="pl-1">Twoja rola</SectionHeader>
            <Card
              variant="highlighted"
              onClick={() => setRoleVisible((v) => !v)}
              className="w-full p-5 cursor-pointer active:scale-[0.98]"
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
                      className={`font-display text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                    >
                      {ROLE_LABELS[currentPlayer.role ?? "civilian"]}
                    </p>
                    {currentPlayer.role === "mafia" && (
                      <p className="text-stamp/70 text-xs font-display mt-1">
                        Twoi wspólnicy są oznaczeni na liście
                      </p>
                    )}
                    <p className="text-on-surface/40 text-sm mt-1">Stuknij aby ukryć</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="material-symbols-outlined text-[32px] text-on-surface/20">
                    visibility_off
                  </span>
                  <p className="font-display text-on-surface/40 uppercase tracking-widest text-sm">
                    Stuknij aby zobaczyć rolę
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {!isHost && currentPlayer.isAlive && (
          <NightActionPanel
            role={roleVisible ? (currentPlayer.role as Role) || null : null}
            targets={actionTargets}
            myAction={myAction}
            roleHidden={!roleVisible}
            actionState={actionState}
            mafiaState={mafiaState}
          />
        )}

        {!isHost && !currentPlayer.isAlive && (
          <DeadSpectatorView
            currentPlayer={{ role: currentPlayer.role || undefined }}
            players={players}
          />
        )}

        {isHost && (
          <InfoCard
            icon="bedtime"
            title="Trwa noc — czekaj na akcje graczy"
            className="mx-5 mt-5"
          />
        )}

        <PlayersList
          players={players}
          isPlaying={true}
          isFinished={false}
          isLobby={false}
          isHost={isHost}
          currentPlayerRole={currentPlayer.role || undefined}
          roleVisible={roleVisible}
          investigatedPlayers={state.investigatedPlayers}
          onKick={onKick}
        />
      </>
    );
  }

  // Finished: brief summary
  if (game.status === "finished") {
    return (
      <div className="mx-5 mt-8 text-center">
        <span className="material-symbols-outlined text-[40px] text-on-surface/20 block mb-3">
          bedtime
        </span>
        <p className="text-on-surface/30 font-display uppercase tracking-widest text-xs">
          Gra zakończona
        </p>
      </div>
    );
  }

  // Other phases (day/voting/review): show last night summary
  return (
    <div className="mx-5 mt-6">
      {lastNightSummary ? (
        <div className="border border-on-surface/10 bg-surface-low p-5">
          <p className="text-on-surface/35 font-display font-bold uppercase tracking-widest text-[10px] mb-3">
            Noc {lastNightSummary.round} — podsumowanie
          </p>
          {lastNightSummary.killedNickname ? (
            <div>
              <p className="font-display text-stamp font-bold uppercase tracking-wider text-sm mb-1">
                Tej nocy zginął:
              </p>
              <p className="font-display text-2xl font-bold text-on-surface">
                {lastNightSummary.killedNickname}
              </p>
              {lastNightSummary.savedByDoctor && (
                <p className="text-xs text-on-surface/30 mt-2 font-display">
                  Lekarz uratował kogoś innego tej nocy
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-on-surface/60">
                Nikt nie zginął tej nocy
              </p>
              {lastNightSummary.savedByDoctor && (
                <p className="text-xs text-on-surface/40 mt-2 font-display">
                  Lekarz uratował zaatakowanego gracza!
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10">
          <span className="material-symbols-outlined text-[36px] text-on-surface/15">bedtime</span>
          <p className="text-on-surface/25 font-display uppercase tracking-widest text-xs text-center">
            Brak danych z poprzedniej nocy
          </p>
        </div>
      )}
    </div>
  );
}

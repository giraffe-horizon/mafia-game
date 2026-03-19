"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { GameStateResponse, PublicPlayer } from "@/db";
import type { Role, ActionType, GamePhase } from "@/db/types";
import { SectionHeader } from "@/components/ui"; // used for action progress

const ACTION_ROLE_MAP: Record<Role, ActionType> = {
  mafia: "kill",
  detective: "investigate",
  doctor: "protect",
  civilian: "wait",
};

interface GMGameTabProps {
  hostActions?: GameStateResponse["hostActions"];
  players: PublicPlayer[];
  phase: GamePhase;
  phaseProgress?: GameStateResponse["phaseProgress"];
  onGmAction: (forPlayerId: string, actionType: ActionType, targetPlayerId: string) => void;
  onPhase: (p: GamePhase) => void;
  phasePending: boolean;
  nextPhase?: { label: string; phase: GamePhase; icon: string };
}

export default function GMGameTab({
  hostActions,
  players,
  phase,
  phaseProgress,
  onGmAction,
  onPhase,
  phasePending,
  nextPhase,
}: GMGameTabProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<string>("");

  const alivePlayers = players.filter((p) => p.isAlive && !p.isHost);
  const actedPlayerIds = new Set(hostActions?.map((a) => a.playerId) ?? []);

  const selectedPlayerData = alivePlayers.find((p) => p.playerId === selectedPlayer);
  const actionType = selectedPlayerData?.role
    ? (ACTION_ROLE_MAP[selectedPlayerData.role] ?? "wait")
    : "vote";
  const isVoting = phase === "voting";

  function handleSubmit() {
    if (!selectedPlayer) return;
    const type = isVoting ? "vote" : actionType;
    onGmAction(selectedPlayer, type, selectedTarget);
    setSelectedPlayer("");
    setSelectedTarget("");
  }

  const canAdvancePhase =
    (phaseProgress?.allDone ?? true) && (phaseProgress?.mafiaUnanimous ?? true) && !phasePending;

  return (
    <div className="flex flex-col gap-4">
      {/* Phase hint */}
      {phaseProgress && (
        <div className="border-l-2 border-stamp pl-3 py-1">
          <p className="text-on-surface/60 text-xs font-display">{phaseProgress.hint}</p>
        </div>
      )}

      {/* Action progress */}
      {phaseProgress && phaseProgress.requiredActions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionHeader className="mb-0">Postęp akcji</SectionHeader>
            <span className="text-on-surface/35 text-[10px] font-display">
              {phaseProgress.requiredActions.filter((a) => a.done).length}/
              {phaseProgress.requiredActions.length}
            </span>
          </div>
          <div className="w-full bg-surface-highest h-1 mb-3">
            <div
              className="bg-stamp h-1"
              style={{
                width: `${
                  phaseProgress.requiredActions.length === 0
                    ? 100
                    : (phaseProgress.requiredActions.filter((a) => a.done).length /
                        phaseProgress.requiredActions.length) *
                      100
                }%`,
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            {[...phaseProgress.requiredActions]
              .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
              .map((action) => (
                <div
                  key={action.playerId}
                  className="flex items-center gap-2 py-1.5 border-b border-on-surface/8 last:border-0"
                >
                  <span
                    className={`material-symbols-outlined text-[14px] shrink-0 ${
                      action.done ? "text-green-400" : "text-on-surface/30"
                    }`}
                  >
                    {action.done ? "check_circle" : "schedule"}
                  </span>
                  <span className="text-on-surface text-xs font-display flex-1">
                    {action.nickname}
                    {action.role === "mafia" &&
                      hostActions &&
                      (() => {
                        const mafiaAction = hostActions.find(
                          (ha) => ha.playerId === action.playerId && ha.actionType === "kill"
                        );
                        return mafiaAction?.targetNickname ? (
                          <span className="text-stamp/70 ml-2">→ {mafiaAction.targetNickname}</span>
                        ) : null;
                      })()}
                  </span>
                  <span className="text-on-surface/25 text-[10px] font-display uppercase tracking-wider">
                    {ROLE_LABELS[action.role] ?? action.role}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mafia consensus warning */}
      {phase === "night" && phaseProgress && !phaseProgress.mafiaUnanimous && (
        <div className="border border-stamp/30 bg-stamp/5 p-3">
          <span className="text-stamp text-xs font-display uppercase tracking-wider">
            Mafia nie jest zgodna — przejście zablokowane
          </span>
        </div>
      )}

      {/* GM override */}
      {alivePlayers.length > 0 && (phase === "night" || phase === "voting") && (
        <div className="border border-on-surface/12 bg-surface-low">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-on-surface/8">
            <span className="material-symbols-outlined text-[14px] text-on-surface/30">
              admin_panel_settings
            </span>
            <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
              Override akcji gracza
            </p>
          </div>
          <div className="p-3">
            <select
              value={selectedPlayer}
              onChange={(e) => {
                setSelectedPlayer(e.target.value);
                setSelectedTarget("");
              }}
              className="w-full h-10 bg-background border border-on-surface/20 text-on-surface text-sm px-3 mb-2 font-display focus:outline-none focus:border-stamp"
            >
              <option value="">— Wybierz gracza —</option>
              {alivePlayers.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {p.nickname} ({ROLE_LABELS[p.role ?? "civilian"] ?? "?"})
                  {actedPlayerIds.has(p.playerId) ? " ✓" : " ⏳"}
                </option>
              ))}
            </select>
            {selectedPlayer && (
              <>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full h-10 bg-background border border-on-surface/20 text-on-surface text-sm px-3 mb-2 font-display focus:outline-none focus:border-stamp"
                >
                  <option value="">— Wybierz cel —</option>
                  {alivePlayers
                    .filter((p) => p.playerId !== selectedPlayer)
                    .map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.nickname}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedTarget && actionType !== "wait"}
                  className="w-full h-10 bg-stamp text-on-paper font-display font-bold uppercase tracking-widest text-xs border border-stamp hover:bg-stamp/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Zatwierdź override
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Phase advance button — classified action stamp */}
      {nextPhase ? (
        <div className="relative">
          <button
            onClick={() => onPhase(nextPhase.phase)}
            disabled={!canAdvancePhase}
            className={`flex w-full items-center justify-center gap-2 h-14 font-display font-bold uppercase tracking-widest text-sm border-2 ${
              !canAdvancePhase
                ? "border-on-surface/15 text-on-surface/25 cursor-not-allowed"
                : "border-stamp bg-stamp text-on-paper hover:bg-stamp/90"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {phase === "night" ? "wb_sunny" : phase === "day" ? "how_to_vote" : "bedtime"}
            </span>
            {phasePending
              ? "Czekaj..."
              : phase === "night"
                ? "Zacznij dzień"
                : phase === "day"
                  ? "Zacznij głosowanie"
                  : phase === "voting"
                    ? "Zacznij noc"
                    : nextPhase.label}
          </button>
          {canAdvancePhase && !phasePending && (
            <span
              className="absolute -top-2 -right-2 stamp stamp-red text-[8px] py-0 px-1 pointer-events-none"
              style={{ transform: "rotate(3deg)" }}
            >
              WYKONAJ
            </span>
          )}
        </div>
      ) : (
        <p className="text-on-surface/30 text-xs font-display text-center uppercase tracking-wider">
          Brak dostępnych przejść
        </p>
      )}

      {!canAdvancePhase && phaseProgress && (
        <p className="text-on-surface/30 text-[10px] font-display text-center">
          Czekaj na:{" "}
          {phaseProgress.requiredActions
            .filter((a) => !a.done)
            .map((a) => a.nickname)
            .join(", ")}
        </p>
      )}
    </div>
  );
}

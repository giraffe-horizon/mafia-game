"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { GameStateResponse, PublicPlayer } from "@/db";
import type { Role, ActionType, GamePhase } from "@/db/types";
import { SectionHeader, Button } from "@/components/ui";

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

  // GM can advance phase when all actions are done AND mafia is unanimous (for night phase)
  const canAdvancePhase =
    (phaseProgress?.allDone ?? true) && (phaseProgress?.mafiaUnanimous ?? true) && !phasePending;

  return (
    <div>
      {/* Hint Box */}
      {phaseProgress && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-slate-300">{phaseProgress.hint}</p>
        </div>
      )}

      {/* Progress Bar */}
      {phaseProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <SectionHeader className="mb-0">Postęp akcji</SectionHeader>
            <span className="text-xs text-slate-400">
              {phaseProgress.requiredActions.filter((a) => a.done).length}/
              {phaseProgress.requiredActions.length}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
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
        </div>
      )}

      {/* Lista graczy ze statusem */}
      {phaseProgress && phaseProgress.requiredActions.length > 0 && (
        <div className="mb-4">
          <SectionHeader>Status graczy</SectionHeader>
          <div className="flex flex-col gap-1">
            {[...phaseProgress.requiredActions]
              .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
              .map((action) => (
                <div
                  key={action.playerId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-black/20"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      action.done ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {action.done ? "check_circle" : "schedule"}
                  </span>
                  <span className="text-white text-xs font-medium flex-1">
                    {action.nickname}
                    {/* Show mafia voting target if available */}
                    {action.role === "mafia" &&
                      hostActions &&
                      (() => {
                        const mafiaAction = hostActions.find(
                          (ha) => ha.playerId === action.playerId && ha.actionType === "kill"
                        );
                        return mafiaAction?.targetNickname ? (
                          <span className="text-red-300 ml-2">→ {mafiaAction.targetNickname}</span>
                        ) : null;
                      })()}
                  </span>
                  <span className="text-slate-400 text-xs font-typewriter">{action.role}</span>
                  <span
                    className={`text-xs font-typewriter ${
                      action.done ? "text-green-400" : "text-yellow-400"
                    }`}
                  >
                    {action.done ? "✅ Gotowe" : "⏳ Oczekuje"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mafia consensus status */}
      {phase === "night" && phaseProgress && !phaseProgress.mafiaUnanimous && (
        <div className="mb-4 p-2 rounded-lg bg-red-950/20 border border-red-900/30">
          <span className="text-red-400 text-xs font-typewriter">
            ⚠️ Mafia nie jest zgodna — przejście do dnia zablokowane
          </span>
        </div>
      )}

      {/* GM override sekcja */}
      {alivePlayers.length > 0 && (phase === "night" || phase === "voting") && (
        <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
          <SectionHeader className="text-primary/70 mb-3">
            Zmień akcję gracza (override GM)
          </SectionHeader>
          <select
            value={selectedPlayer}
            onChange={(e) => {
              setSelectedPlayer(e.target.value);
              setSelectedTarget("");
            }}
            className="w-full h-10 rounded-lg bg-black/40 border border-slate-700 text-white text-sm px-3 mb-2 font-typewriter"
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
                className="w-full h-10 rounded-lg bg-black/40 border border-slate-700 text-white text-sm px-3 mb-2 font-typewriter"
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
                className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold font-typewriter uppercase tracking-wider transition-all disabled:opacity-40"
              >
                Zatwierdź
              </button>
            </>
          )}
        </div>
      )}

      {/* Przycisk przejścia fazy */}
      {nextPhase ? (
        <button
          onClick={() => onPhase(nextPhase.phase)}
          disabled={!canAdvancePhase}
          className={`flex w-full items-center justify-center gap-2 rounded-lg h-12 transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.3)] active:scale-[0.98] font-typewriter uppercase tracking-wider text-sm ${
            !canAdvancePhase
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-white font-bold"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
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
      ) : (
        <p className="text-slate-500 text-sm font-typewriter text-center">
          Brak dostępnych przejść
        </p>
      )}

      {!canAdvancePhase && phaseProgress && (
        <p className="text-slate-500 text-xs font-typewriter text-center mt-2">
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

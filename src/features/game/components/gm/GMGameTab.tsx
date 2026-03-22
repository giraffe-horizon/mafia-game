"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { GameStateResponse, PublicPlayer } from "@/db";
import type { Role, ActionType, GamePhase } from "@/db/types";
import type { PhaseInput } from "@/lib/api/schemas";
import { Button } from "@/components/ui";
import Select from "@/components/ui/Select";

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
  onPhase: (p: PhaseInput["phase"]) => void;
  phasePending: boolean;
  nextPhase?: { label: string; phase: PhaseInput["phase"]; icon: string };
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
    <div className="flex flex-col gap-3">
      {/* Hint Box */}
      {phaseProgress && (
        <div className="border-l-2 border-primary pl-3 py-1">
          <p className="font-display text-xs text-on-surface/70">{phaseProgress.hint}</p>
        </div>
      )}

      {/* Progress */}
      {phaseProgress && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/40">
              Postęp akcji
            </span>
            <span className="font-display text-[10px] text-on-surface/40">
              {phaseProgress.requiredActions.filter((a) => a.done).length}/
              {phaseProgress.requiredActions.length}
            </span>
          </div>
          <div className="w-full bg-surface-highest h-1">
            <div
              className="bg-primary h-1"
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

      {/* Player status list */}
      {phaseProgress && phaseProgress.requiredActions.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {[...phaseProgress.requiredActions]
            .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
            .map((action) => (
              <div
                key={action.playerId}
                className="flex items-center gap-2 py-1.5 border-b border-on-surface/5"
              >
                <span
                  className={`material-symbols-outlined text-[14px] ${
                    action.done ? "text-green-400" : "text-amber-400"
                  }`}
                >
                  {action.done ? "check_circle" : "schedule"}
                </span>
                <span className="font-display text-xs text-on-surface flex-1 uppercase tracking-wide">
                  {action.nickname}
                  {action.role === "mafia" &&
                    hostActions &&
                    (() => {
                      const mafiaAction = hostActions.find(
                        (ha) => ha.playerId === action.playerId && ha.actionType === "kill"
                      );
                      return mafiaAction?.targetNickname ? (
                        <span className="text-primary ml-1">→ {mafiaAction.targetNickname}</span>
                      ) : null;
                    })()}
                </span>
                <span className="font-display text-[10px] text-on-surface/40 uppercase tracking-widest">
                  {ROLE_LABELS[action.role] ?? action.role}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Mafia consensus warning */}
      {phase === "night" && phaseProgress && !phaseProgress.mafiaUnanimous && (
        <div className="border border-primary/30 bg-[#1a0505] px-3 py-2">
          <span className="font-display text-xs text-primary uppercase tracking-widest">
            Mafia nie jest zgodna
          </span>
        </div>
      )}

      {/* GM override */}
      {alivePlayers.length > 0 && (phase === "night" || phase === "voting") && (
        <div className="border border-on-surface/20 p-3 flex flex-col gap-2 crt-surface">
          <span className="font-display font-black text-[10px] uppercase tracking-widest text-primary/60">
            Override gracza
          </span>
          <Select
            value={selectedPlayer}
            onChange={(value) => {
              setSelectedPlayer(value);
              setSelectedTarget("");
            }}
            options={[
              { value: "", label: "— Wybierz gracza —" },
              ...alivePlayers.map((p) => ({
                value: p.playerId,
                label: `${p.nickname} (${ROLE_LABELS[p.role ?? "civilian"] ?? "?"})${actedPlayerIds.has(p.playerId) ? " ✓" : " ⏳"}`,
              })),
            ]}
          />
          {selectedPlayer && (
            <>
              <Select
                value={selectedTarget}
                onChange={setSelectedTarget}
                options={[
                  { value: "", label: "— Wybierz cel —" },
                  ...alivePlayers
                    .filter((p) => p.playerId !== selectedPlayer)
                    .map((p) => ({ value: p.playerId, label: p.nickname })),
                ]}
              />
              <Button
                onClick={handleSubmit}
                disabled={!selectedTarget && actionType !== "wait"}
                className="w-full"
              >
                Zatwierdź
              </Button>
            </>
          )}
        </div>
      )}

      {/* Phase advance button */}
      {nextPhase ? (
        <Button
          onClick={() => onPhase(nextPhase.phase)}
          disabled={!canAdvancePhase}
          loading={phasePending}
          icon={phase === "night" ? "wb_sunny" : phase === "day" ? "how_to_vote" : "bedtime"}
          variant={canAdvancePhase ? "primary" : "secondary"}
          className="w-full h-12"
        >
          {phasePending
            ? "Czekaj..."
            : phase === "night"
              ? "Zacznij dzień"
              : phase === "day"
                ? "Zacznij głosowanie"
                : phase === "voting"
                  ? "Zacznij noc"
                  : nextPhase.label}
        </Button>
      ) : (
        <p className="font-display text-on-surface/40 text-xs text-center uppercase tracking-widest">
          Brak dostępnych przejść
        </p>
      )}

      {!canAdvancePhase && phaseProgress && (
        <p className="font-display text-on-surface/40 text-[10px] text-center uppercase tracking-widest">
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

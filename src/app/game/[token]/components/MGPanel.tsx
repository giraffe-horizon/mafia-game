"use client";

import { useState } from "react";
import { MISSION_PRESETS, CATEGORY_LABELS } from "@/lib/missions-presets";
import type { GameStateResponse, PublicPlayer } from "@/lib/db";

const ROLE_LABELS: Record<string, string> = {
  mafia: "Mafia",
  detective: "Detektyw",
  doctor: "Doktor",
  civilian: "Cywil",
  gm: "Mistrz Gry",
};

const ACTION_ROLE_MAP: Record<string, string> = {
  mafia: "kill",
  detective: "investigate",
  doctor: "protect",
  civilian: "wait",
};

// ---------------------------------------------------------------------------
// GmGameTab
// ---------------------------------------------------------------------------
function GmGameTab({
  hostActions,
  players,
  phase,
  phaseProgress,
  onGmAction,
  onPhase,
  phasePending,
  nextPhase,
}: {
  hostActions?: GameStateResponse["hostActions"];
  players: PublicPlayer[];
  phase: string;
  phaseProgress?: GameStateResponse["phaseProgress"];
  onGmAction: (forPlayerId: string, actionType: string, targetPlayerId: string) => void;
  onPhase: (p: string) => void;
  phasePending: boolean;
  nextPhase?: { label: string; phase: string; icon: string };
}) {
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
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
              Postęp akcji
            </p>
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
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2">
            Status graczy
          </p>
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

      {/* Głosy mafii - detailed mafia voting info for night phase */}
      {phase === "night" && hostActions && hostActions.some((ha) => ha.actionType === "kill") && (
        <div className="mb-4">
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2">
            Głosy mafii
          </p>
          <div className="flex flex-col gap-1">
            {hostActions
              .filter((ha) => ha.actionType === "kill")
              .map((action) => (
                <div
                  key={action.playerId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-red-950/20 border border-red-900/30"
                >
                  <span className="material-symbols-outlined text-[16px] text-red-400">person</span>
                  <span className="text-red-300 text-xs font-medium flex-1">{action.nickname}</span>
                  <span className="text-slate-400 text-xs font-typewriter">
                    → {action.targetNickname || "nie wybrano"}
                  </span>
                </div>
              ))}
          </div>
          {/* Show consensus status */}
          {phaseProgress && (
            <div className="mt-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span
                className={`text-xs font-typewriter ${
                  phaseProgress.mafiaUnanimous ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {phaseProgress.mafiaUnanimous ? "✅ Mafia jest zgodna" : "⚠️ Mafia nie jest zgodna"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* GM override sekcja */}
      {alivePlayers.length > 0 && (phase === "night" || phase === "voting") && (
        <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
          <p className="text-primary/70 text-xs font-typewriter uppercase tracking-widest mb-3">
            Zmień akcję gracza (override GM)
          </p>
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

// ---------------------------------------------------------------------------
// MGPanel
// ---------------------------------------------------------------------------
export default function MGPanel({
  phase,
  players,
  tab,
  onTabChange,
  phasePending,
  onPhase,
  msgTarget,
  msgContent,
  msgPending,
  msgError,
  onMsgTargetChange,
  onMsgContentChange,
  onSendMessage,
  msnTarget,
  msnDesc,
  msnPoints,
  msnPreset,
  msnPending,
  msnError,
  onMsnTargetChange,
  onMsnDescChange,
  onMsnPointsChange,
  onMsnPresetChange,
  onCreateMission,
  hostMissions,
  onCompleteMission,
  onDeleteMission,
  hostActions,
  phaseProgress,
  onGmAction,
  onTransferGm,
  mafiaCountSetting,
  onMafiaCountSettingChange,
}: {
  phase: string;
  players: PublicPlayer[];
  tab: "game" | "message" | "mission" | "settings";
  onTabChange: (t: "game" | "message" | "mission" | "settings") => void;
  phasePending: boolean;
  onPhase: (p: string) => void;
  msgTarget: string;
  msgContent: string;
  msgPending: boolean;
  msgError: string;
  onMsgTargetChange: (v: string) => void;
  onMsgContentChange: (v: string) => void;
  onSendMessage: () => void;
  msnTarget: string;
  msnDesc: string;
  msnPoints: 1 | 2 | 3;
  msnPreset: string;
  msnPending: boolean;
  msnError: string;
  onMsnTargetChange: (v: string) => void;
  onMsnDescChange: (v: string) => void;
  onMsnPointsChange: (v: 1 | 2 | 3) => void;
  onMsnPresetChange: (v: string) => void;
  onCreateMission: () => void;
  hostMissions?: GameStateResponse["hostMissions"];
  onCompleteMission: (id: string) => void;
  onDeleteMission: (id: string) => void;
  hostActions?: GameStateResponse["hostActions"];
  phaseProgress?: GameStateResponse["phaseProgress"];
  onGmAction: (forPlayerId: string, actionType: string, targetPlayerId: string) => void;
  onTransferGm: (playerId: string) => void;
  mafiaCountSetting: number;
  onMafiaCountSettingChange: (n: number) => void;
}) {
  // Fix 5: transferGmTarget state lives here, not in parent
  const [transferGmTarget, setTransferGmTarget] = useState("");
  const [transferGmPending, setTransferGmPending] = useState(false);
  const [transferGmError, setTransferGmError] = useState("");

  async function handleTransferGm() {
    if (!transferGmTarget) return;
    setTransferGmPending(true);
    setTransferGmError("");
    try {
      onTransferGm(transferGmTarget);
      setTransferGmTarget("");
    } catch {
      setTransferGmError("Błąd przekazania MG");
    } finally {
      setTransferGmPending(false);
    }
  }

  const nextPhaseMap: Record<string, { label: string; phase: string; icon: string }> = {
    night: { label: "Przejdź do Dnia", phase: "day", icon: "wb_sunny" },
    day: { label: "Głosowanie", phase: "voting", icon: "how_to_vote" },
    voting: { label: "Następna Noc", phase: "night", icon: "bedtime" },
  };
  const nextPhase = nextPhaseMap[phase];

  const TABS = [
    { id: "game" as const, icon: "gamepad", label: "Gra" },
    { id: "message" as const, icon: "mail", label: "Wiad." },
    { id: "mission" as const, icon: "task", label: "Misje" },
    { id: "settings" as const, icon: "settings", label: "Ustaw." },
  ];

  function handlePresetChange(value: string) {
    onMsnPresetChange(value);
    if (value !== "custom") {
      const idx = parseInt(value, 10);
      const preset = MISSION_PRESETS[idx];
      if (preset) {
        onMsnDescChange(preset.description);
        onMsnPointsChange(preset.points);
      }
    }
  }

  return (
    <div className="mx-5 mt-5 rounded-xl bg-black/40 border border-primary/20 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex-1 min-w-0 flex flex-col items-center py-2 gap-0.5 transition-colors text-[10px] font-typewriter uppercase tracking-wider whitespace-nowrap ${
              tab === t.id
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Game tab */}
        {tab === "game" && (
          <GmGameTab
            hostActions={hostActions}
            players={players}
            phase={phase}
            phaseProgress={phaseProgress}
            onGmAction={onGmAction}
            onPhase={onPhase}
            phasePending={phasePending}
            nextPhase={nextPhase}
          />
        )}

        {/* Message tab */}
        {tab === "message" && (
          <div className="flex flex-col gap-3">
            <select
              value={msgTarget}
              onChange={(e) => onMsgTargetChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter focus:outline-none focus:border-primary/50"
            >
              <option value="">Wszyscy (broadcast)</option>
              {players.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {p.nickname}
                </option>
              ))}
            </select>
            <textarea
              value={msgContent}
              onChange={(e) => onMsgContentChange(e.target.value)}
              placeholder="Treść wiadomości..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
            />
            {msgError && <p className="text-red-400 text-xs font-typewriter">{msgError}</p>}
            <button
              onClick={onSendMessage}
              disabled={msgPending || !msgContent.trim()}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-typewriter uppercase tracking-wider text-sm transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              {msgPending ? "Wysyłam..." : "Wyślij"}
            </button>
          </div>
        )}

        {/* Mission tab */}
        {tab === "mission" && (
          <div className="flex flex-col gap-3">
            {hostMissions && hostMissions.length > 0 && (
              <div className="flex flex-col gap-2 mb-1">
                <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
                  Aktywne misje
                </p>
                {hostMissions.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border ${m.isCompleted ? "bg-green-950/20 border-green-900/30 opacity-60" : "bg-black/30 border-slate-700"}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-typewriter font-bold uppercase ${m.isCompleted ? "text-green-500" : "text-slate-500"}`}
                          >
                            {m.playerNickname}
                          </span>
                          <span className="text-slate-700 text-[10px]">·</span>
                          <span className="text-yellow-600 text-[10px] font-typewriter">
                            +{m.points}pkt
                          </span>
                          {m.isCompleted && <span className="text-green-500 text-[10px]">✓</span>}
                        </div>
                        <p
                          className={`text-xs ${m.isCompleted ? "text-slate-500 line-through" : "text-slate-300"}`}
                        >
                          {m.description}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        {!m.isCompleted && (
                          <button
                            onClick={() => onCompleteMission(m.id)}
                            title="Oznacz jako wykonaną"
                            className="w-7 h-7 flex items-center justify-center rounded bg-green-900/30 hover:bg-green-900/60 border border-green-800/40 transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px] text-green-400">
                              check
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteMission(m.id)}
                          title="Usuń misję"
                          className="w-7 h-7 flex items-center justify-center rounded bg-red-950/30 hover:bg-red-950/60 border border-red-900/30 transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px] text-red-500">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hostMissions && hostMissions.length === 0 && (
              <p className="text-slate-600 text-xs font-typewriter text-center py-2">
                Brak misji — utwórz poniżej
              </p>
            )}

            <div className="border-t border-slate-800 pt-3">
              <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3">
                Nowa misja
              </p>
            </div>

            <select
              value={msnTarget}
              onChange={(e) => onMsnTargetChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter focus:outline-none focus:border-primary/50"
            >
              <option value="">Wybierz gracza...</option>
              {players.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {p.nickname}
                </option>
              ))}
            </select>

            <select
              value={msnPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter focus:outline-none focus:border-primary/50"
            >
              <option value="custom">— Własne zadanie —</option>
              {MISSION_PRESETS.map((p, i) => (
                <option key={i} value={String(i)}>
                  [{CATEGORY_LABELS[p.category]}] {p.description.substring(0, 40)}…
                </option>
              ))}
            </select>

            <textarea
              value={msnDesc}
              onChange={(e) => {
                onMsnDescChange(e.target.value);
                onMsnPresetChange("custom");
              }}
              placeholder="Opis misji..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 ml-auto">
                {([1, 2, 3] as const).map((pts) => (
                  <button
                    key={pts}
                    onClick={() => onMsnPointsChange(pts)}
                    className={`w-9 h-9 rounded-lg text-sm font-typewriter font-bold border transition-all ${
                      msnPoints === pts
                        ? pts === 1
                          ? "bg-green-900/40 border-green-700 text-green-400"
                          : pts === 2
                            ? "bg-yellow-900/40 border-yellow-700 text-yellow-400"
                            : "bg-red-900/40 border-red-700 text-red-400"
                        : "border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>
            {msnError && <p className="text-red-400 text-xs font-typewriter">{msnError}</p>}
            <button
              onClick={onCreateMission}
              disabled={msnPending || !msnTarget || !msnDesc.trim()}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-typewriter uppercase tracking-wider text-sm transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              {msnPending ? "Tworzę..." : "Utwórz misję"}
            </button>
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div>
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-1">
              Liczba mafii — następna runda
            </p>
            <p className="text-slate-600 text-xs mb-3">
              Ta wartość zostanie użyta przy kolejnym remacie.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onMafiaCountSettingChange(0)}
                className={`px-3 py-2 rounded-lg text-sm font-typewriter uppercase tracking-wider border transition-all ${
                  mafiaCountSetting === 0
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                Auto (
                {players.length <= 5 ? 1 : players.length <= 8 ? 2 : players.length <= 11 ? 3 : 4})
              </button>
              {Array.from({ length: Math.max(1, players.length - 3) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => onMafiaCountSettingChange(n)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold font-typewriter border transition-all ${
                    mafiaCountSetting === n
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-2">reszta cywile</p>

            {/* GM Transfer Section */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3">
                Przekaż rolę MG
              </p>
              {transferGmError && (
                <p className="text-red-400 text-xs font-typewriter mb-2">{transferGmError}</p>
              )}
              <div className="flex gap-3">
                <select
                  value={transferGmTarget}
                  onChange={(e) => setTransferGmTarget(e.target.value)}
                  className="flex-1 h-10 rounded-lg bg-black/40 border border-slate-700 text-white text-sm px-3 font-typewriter"
                >
                  <option value="">— Wybierz gracza —</option>
                  {players
                    .filter((p) => !p.isHost && p.isAlive)
                    .map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.nickname}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleTransferGm}
                  disabled={!transferGmTarget || transferGmPending}
                  className="px-4 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-typewriter uppercase tracking-wider text-sm transition-all disabled:opacity-40"
                >
                  {transferGmPending ? "Przekazuję..." : "Przekaż"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { GameStateResponse, PublicPlayer } from "@/lib/db";

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<string, string> = {
  mafia: "Mafia",
  detective: "Detektyw",
  doctor: "Doktor",
  civilian: "Cywil",
};
const ROLE_ICONS: Record<string, string> = {
  mafia: "masks",
  detective: "search",
  doctor: "medical_services",
  civilian: "person",
};
const ROLE_COLORS: Record<string, string> = {
  mafia: "text-red-500",
  detective: "text-blue-400",
  doctor: "text-green-400",
  civilian: "text-slate-300",
};
const PHASE_LABELS: Record<string, string> = {
  lobby: "Lobby",
  night: "Noc",
  day: "Dzień",
  voting: "Głosowanie",
  ended: "Koniec",
};
const PHASE_ICONS: Record<string, string> = {
  night: "bedtime",
  day: "wb_sunny",
  voting: "how_to_vote",
  lobby: "groups",
  ended: "emoji_events",
};

// ---------------------------------------------------------------------------
// Toast types
// ---------------------------------------------------------------------------
interface Toast {
  id: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function GameClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  // Core state
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [error, setError] = useState("");

  // UI state
  const [roleVisible, setRoleVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const shownMessageIds = useRef<Set<string>>(new Set());

  // Action state
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");

  // MG: phase
  const [phasePending, setPhasePending] = useState(false);

  // MG: start game
  const [starting, setStarting] = useState(false);

  // MG: message form
  const [msgTarget, setMsgTarget] = useState(""); // "" = broadcast, else playerId
  const [msgContent, setMsgContent] = useState("");
  const [msgPending, setMsgPending] = useState(false);
  const [msgError, setMsgError] = useState("");

  // MG: mission form
  const [msnTarget, setMsnTarget] = useState("");
  const [msnDesc, setMsnDesc] = useState("");
  const [msnSecret, setMsnSecret] = useState(false);
  const [msnPoints, setMsnPoints] = useState(0);
  const [msnPending, setMsnPending] = useState(false);
  const [msnError, setMsnError] = useState("");

  // MG panel tab
  const [mgTab, setMgTab] = useState<"phase" | "message" | "mission">("phase");

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${token}/state`);
      if (res.status === 404) { setError("Sesja nie istnieje"); return; }
      if (!res.ok) return;
      const data: GameStateResponse = await res.json();
      setState(data);

      // Push new messages as toasts
      for (const msg of data.messages) {
        if (!shownMessageIds.current.has(msg.id)) {
          shownMessageIds.current.add(msg.id);
          setToasts((prev) => [...prev, { id: msg.id, content: msg.content }]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== msg.id));
          }, 7000);
        }
      }
    } catch {
      // silent retry
    }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/game/${token}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Błąd");
      else await fetchState();
    } catch { setError("Błąd połączenia"); }
    finally { setStarting(false); }
  }

  async function handlePhase(newPhase: string) {
    setPhasePending(true);
    try {
      const res = await fetch(`/api/game/${token}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: newPhase }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Błąd zmiany fazy");
      else await fetchState();
    } catch { setError("Błąd połączenia"); }
    finally { setPhasePending(false); }
  }

  async function handleAction(actionType: string, targetPlayerId: string) {
    setActionPending(true);
    setActionError("");
    try {
      const res = await fetch(`/api/game/${token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: actionType, targetPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) setActionError(data.error ?? "Błąd");
      else await fetchState();
    } catch { setActionError("Błąd połączenia"); }
    finally { setActionPending(false); }
  }

  async function handleVote(targetPlayerId: string) {
    await handleAction("vote", targetPlayerId);
  }

  async function handleSendMessage() {
    if (!msgContent.trim()) return;
    setMsgPending(true);
    setMsgError("");
    try {
      const res = await fetch(`/api/game/${token}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgContent, toPlayerId: msgTarget || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setMsgError(data.error ?? "Błąd");
      else { setMsgContent(""); await fetchState(); }
    } catch { setMsgError("Błąd połączenia"); }
    finally { setMsgPending(false); }
  }

  async function handleCreateMission() {
    if (!msnTarget || !msnDesc.trim()) return;
    setMsnPending(true);
    setMsnError("");
    try {
      const res = await fetch(`/api/game/${token}/mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlayerId: msnTarget,
          description: msnDesc,
          isSecret: msnSecret,
          points: msnPoints,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsnError(data.error ?? "Błąd");
      else { setMsnDesc(""); setMsnTarget(""); setMsnSecret(false); setMsnPoints(0); }
    } catch { setMsnError("Błąd połączenia"); }
    finally { setMsnPending(false); }
  }

  async function handleCompleteMission(missionId: string) {
    try {
      await fetch(`/api/game/${token}/mission/${missionId}/complete`, { method: "POST" });
      await fetchState();
    } catch { /* ignore */ }
  }

  function copyCode() {
    if (!state) return;
    navigator.clipboard.writeText(state.game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // Loading / Error screens
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex min-h-[844px] w-full max-w-[390px] flex-col items-center justify-center bg-background-dark mx-auto sm:my-8 sm:rounded-[2.5rem] border border-slate-800">
        <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
        <p className="text-slate-300 font-typewriter text-lg text-center px-8">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 text-primary font-typewriter uppercase tracking-widest text-sm hover:text-primary/80 transition-colors"
        >
          ← Powrót
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[844px] w-full max-w-[390px] flex-col items-center justify-center bg-background-dark mx-auto sm:my-8 sm:rounded-[2.5rem] border border-slate-800">
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">refresh</span>
        <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">Ładowanie...</p>
      </div>
    );
  }

  const { game, currentPlayer, players, missions, detectiveResult } = state;
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const isPlaying = game.status === "playing";
  const isFinished = game.status === "finished";
  const phase = game.phase;
  const myAction = state.myAction;

  // Players eligible for actions (alive, not self)
  const actionTargets = players.filter((p) => p.isAlive && !p.isYou && !p.isHost);
  // Alive non-host players for MG forms
  const nonHostPlayers = players.filter((p) => !p.isHost);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-[844px] w-full max-w-[390px] flex-col bg-background-dark overflow-hidden border border-slate-800 shadow-2xl mx-auto sm:my-8 sm:rounded-[2.5rem]">
      {/* Background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Toast overlay */}
      {toasts.length > 0 && (
        <div className="absolute top-16 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-primary/30 rounded-xl px-4 py-3 shadow-lg pointer-events-auto"
            >
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">mail</span>
                <p className="text-white text-sm font-typewriter">{t.content}</p>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="ml-auto shrink-0 text-slate-500 hover:text-slate-300"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
        <button
          onClick={() => router.push("/")}
          className="size-10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="font-typewriter text-primary text-base font-bold tracking-widest drop-shadow-[0_0_6px_rgba(218,11,11,0.5)]">
            MAFIA
          </h2>
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
            {PHASE_LABELS[phase]}
            {game.round > 0 && ` · Runda ${game.round}`}
          </p>
        </div>
        <div className="size-10 flex items-center justify-center">
          <span
            className={`text-xs font-typewriter px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${
              isHost
                ? "text-primary border-primary/40 bg-primary/10"
                : "text-slate-400 border-slate-700 bg-slate-800/50"
            }`}
          >
            {isHost ? "MG" : "Gracz"}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-6">

        {/* ── LOBBY ── */}
        {isLobby && (
          <>
            {isHost && (
              <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-primary/20">
                <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2">
                  Kod sesji — udostępnij graczom
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-typewriter text-2xl font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(218,11,11,0.3)]">
                    {game.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-typewriter uppercase tracking-wider transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Skopiowano" : "Kopiuj"}
                  </button>
                </div>
              </div>
            )}
            {!isHost && (
              <div className="mx-5 mt-5 p-5 rounded-xl bg-black/30 border border-slate-800 text-center">
                <span className="material-symbols-outlined text-[36px] text-primary/60 mb-2 block animate-pulse">
                  hourglass_empty
                </span>
                <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
                  Czekaj na start
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Mistrz gry niedługo rozpocznie rozgrywkę
                </p>
              </div>
            )}
          </>
        )}

        {/* ── PLAYING: role card for non-host ── */}
        {isPlaying && !isHost && (
          <div className="mx-5 mt-5">
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
              Twoja rola
            </p>
            <button
              onClick={() => setRoleVisible((v) => !v)}
              className="w-full p-5 rounded-xl bg-black/60 border border-primary/20 hover:border-primary/40 transition-all active:scale-[0.98]"
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
                      className={`font-typewriter text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                    >
                      {ROLE_LABELS[currentPlayer.role ?? "civilian"]}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">Stuknij aby ukryć</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="material-symbols-outlined text-[32px] text-slate-600">
                    visibility_off
                  </span>
                  <p className="font-typewriter text-slate-500 uppercase tracking-widest text-sm">
                    Stuknij aby zobaczyć rolę
                  </p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* ── PLAYING: phase indicator for host ── */}
        {isPlaying && isHost && (
          <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-slate-700 flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-primary">
              {PHASE_ICONS[phase]}
            </span>
            <div>
              <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
                Faza gry
              </p>
              <p className="font-typewriter text-xl font-bold text-white uppercase tracking-wider">
                {PHASE_LABELS[phase]}
              </p>
            </div>
          </div>
        )}

        {/* ── NIGHT: action panel for players ── */}
        {isPlaying && !isHost && phase === "night" && currentPlayer.isAlive && (
          <NightActionPanel
            role={currentPlayer.role}
            targets={actionTargets}
            myAction={myAction}
            pending={actionPending}
            error={actionError}
            onAction={handleAction}
          />
        )}

        {/* ── VOTING: vote panel for players ── */}
        {isPlaying && !isHost && phase === "voting" && currentPlayer.isAlive && (
          <VotePanel
            targets={players.filter((p) => p.isAlive && !p.isYou)}
            myAction={myAction}
            pending={actionPending}
            error={actionError}
            onVote={handleVote}
          />
        )}

        {/* ── Detective result card ── */}
        {detectiveResult && isPlaying && !isHost && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-blue-950/30 border border-blue-800/40">
            <p className="text-blue-400 text-xs font-typewriter uppercase tracking-widest mb-2">
              Wynik śledztwa — Runda {detectiveResult.round}
            </p>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px] text-blue-400">search</span>
              <div>
                <p className="text-white font-medium">{detectiveResult.targetNickname}</p>
                <p
                  className={`text-sm font-typewriter font-bold ${
                    detectiveResult.isMafia ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {detectiveResult.isMafia ? "MAFIA" : "NIE MAFIA"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Missions card (non-host) ── */}
        {!isHost && missions.length > 0 && (
          <div className="mx-5 mt-4">
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
              Twoje misje
            </p>
            <div className="flex flex-col gap-2">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg bg-black/40 border border-yellow-900/40"
                >
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-yellow-500 mt-0.5 shrink-0">
                      {m.isSecret ? "lock" : "task"}
                    </span>
                    <p className="text-white text-sm flex-1">{m.description}</p>
                    {m.points > 0 && (
                      <span className="text-yellow-400 text-xs font-typewriter font-bold shrink-0">
                        +{m.points}pkt
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PLAYING: day message for non-host non-action ── */}
        {isPlaying && !isHost && phase === "day" && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
            <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
              Dzień — dyskutujcie i szukajcie mafii
            </p>
          </div>
        )}

        {/* ── FINISHED: end screen ── */}
        {isFinished && (
          <EndScreen game={game} players={players} currentPlayer={currentPlayer} />
        )}

        {/* ── MG controls panel ── */}
        {isPlaying && isHost && (
          <MGPanel
            phase={phase}
            players={nonHostPlayers}
            tab={mgTab}
            onTabChange={setMgTab}
            phasePending={phasePending}
            onPhase={handlePhase}
            msgTarget={msgTarget}
            msgContent={msgContent}
            msgPending={msgPending}
            msgError={msgError}
            onMsgTargetChange={setMsgTarget}
            onMsgContentChange={setMsgContent}
            onSendMessage={handleSendMessage}
            msnTarget={msnTarget}
            msnDesc={msnDesc}
            msnSecret={msnSecret}
            msnPoints={msnPoints}
            msnPending={msnPending}
            msnError={msnError}
            onMsnTargetChange={setMsnTarget}
            onMsnDescChange={setMsnDesc}
            onMsnSecretChange={setMsnSecret}
            onMsnPointsChange={setMsnPoints}
            onCreateMission={handleCreateMission}
          />
        )}

        {/* ── MG mission management (see all player missions) ── */}
        {isHost && isPlaying && (
          <MGMissions token={token} players={nonHostPlayers} onComplete={handleCompleteMission} />
        )}

        {/* ── Players list ── */}
        <div className="mx-5 mt-5">
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">
            Gracze ({players.length})
          </p>
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <PlayerRow
                key={p.playerId}
                player={p}
                isGamePlaying={isPlaying || isFinished}
                isHost={isHost}
              />
            ))}
          </div>
        </div>

        {/* ── Lobby: start button ── */}
        {isHost && isLobby && (
          <div className="mx-5 mt-6">
            {players.length < 4 && (
              <p className="text-slate-500 text-sm font-typewriter text-center mb-3">
                Potrzeba minimum 4 graczy ({players.length}/4)
              </p>
            )}
            <button
              onClick={handleStart}
              disabled={starting || players.length < 4}
              className="flex w-full items-center justify-center rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-typewriter uppercase tracking-wider"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlayerRow({
  player,
  isGamePlaying,
  isHost,
}: {
  player: PublicPlayer;
  isGamePlaying: boolean;
  isHost: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        player.isYou
          ? "border-primary/40 bg-primary/5"
          : "border-slate-800 bg-black/20"
      } ${!player.isAlive ? "opacity-40" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center border ${
          player.isHost
            ? "border-primary/50 bg-primary/10"
            : "border-slate-700 bg-slate-800"
        }`}
      >
        <span className="material-symbols-outlined text-[18px] text-slate-400">
          {player.isHost ? "manage_accounts" : "person"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{player.nickname}</span>
          {player.isYou && <span className="text-xs text-primary font-typewriter">(ty)</span>}
          {player.isHost && (
            <span className="text-xs text-primary/70 font-typewriter uppercase">MG</span>
          )}
        </div>
        {!player.isAlive && (
          <span className="text-xs text-slate-600 font-typewriter uppercase">Wyeliminowany</span>
        )}
      </div>
      {player.role && (isGamePlaying) && (isHost || player.isYou) && (
        <span
          className={`text-xs font-typewriter font-bold uppercase px-2 py-1 rounded border ${
            player.role === "mafia"
              ? "text-red-400 border-red-900/50 bg-red-950/30"
              : player.role === "detective"
              ? "text-blue-400 border-blue-900/50 bg-blue-950/30"
              : player.role === "doctor"
              ? "text-green-400 border-green-900/50 bg-green-950/30"
              : "text-slate-400 border-slate-700 bg-slate-900/30"
          }`}
        >
          {ROLE_LABELS[player.role]}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function NightActionPanel({
  role,
  targets,
  myAction,
  pending,
  error,
  onAction,
}: {
  role: string | null;
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onAction: (type: string, targetId: string) => void;
}) {
  const actionMap: Record<string, { type: string; label: string; icon: string; color: string }> = {
    mafia: { type: "kill", label: "Wybierz ofiarę", icon: "skull", color: "text-red-400" },
    detective: { type: "investigate", label: "Sprawdź gracza", icon: "search", color: "text-blue-400" },
    doctor: { type: "protect", label: "Chroń gracza", icon: "medical_services", color: "text-green-400" },
  };

  const action = role ? actionMap[role] : null;
  if (!action) {
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
        <span className="material-symbols-outlined text-[28px] text-slate-600 mb-1 block">
          bedtime
        </span>
        <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
          Noc — czekaj na rozkazy
        </p>
      </div>
    );
  }

  if (myAction) {
    const targetName = targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ?? myAction.targetPlayerId;
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
        <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          Akcja złożona
        </p>
        <p className="text-slate-300 text-sm">
          Cel: <span className="text-white font-medium">{targetName}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-5 mt-4">
      <p className={`text-xs font-typewriter uppercase tracking-widest mb-3 pl-1 ${action.color}`}>
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">{action.icon}</span>
        {action.label}
      </p>
      {error && (
        <p className="text-red-400 text-xs font-typewriter mb-2 px-1">{error}</p>
      )}
      <div className="flex flex-col gap-2">
        {targets.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => onAction(action.type, p.playerId)}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-black/30 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-40 text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
            <span className="text-white text-sm">{p.nickname}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function VotePanel({
  targets,
  myAction,
  pending,
  error,
  onVote,
}: {
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onVote: (targetId: string) => void;
}) {
  if (myAction) {
    const targetName = targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ?? myAction.targetPlayerId;
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
        <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          Głos oddany
        </p>
        <p className="text-slate-300 text-sm">
          Zagłosowałeś na: <span className="text-white font-medium">{targetName}</span>
        </p>
      </div>
    );
  }

  const alivePlayers = targets.filter((p) => p.isAlive);

  return (
    <div className="mx-5 mt-4">
      <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">how_to_vote</span>
        Zagłosuj na podejrzanego
      </p>
      {error && <p className="text-red-400 text-xs font-typewriter mb-2 px-1">{error}</p>}
      <div className="flex flex-col gap-2">
        {alivePlayers.map((p) => (
          <button
            key={p.playerId}
            disabled={pending}
            onClick={() => onVote(p.playerId)}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-black/30 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-40 text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
            <span className="text-white text-sm">{p.nickname}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function MGPanel({
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
  msnSecret,
  msnPoints,
  msnPending,
  msnError,
  onMsnTargetChange,
  onMsnDescChange,
  onMsnSecretChange,
  onMsnPointsChange,
  onCreateMission,
}: {
  phase: string;
  players: PublicPlayer[];
  tab: "phase" | "message" | "mission";
  onTabChange: (t: "phase" | "message" | "mission") => void;
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
  msnSecret: boolean;
  msnPoints: number;
  msnPending: boolean;
  msnError: string;
  onMsnTargetChange: (v: string) => void;
  onMsnDescChange: (v: string) => void;
  onMsnSecretChange: (v: boolean) => void;
  onMsnPointsChange: (v: number) => void;
  onCreateMission: () => void;
}) {
  const nextPhaseMap: Record<string, { label: string; phase: string; icon: string }> = {
    night: { label: "Przejdź do Dnia", phase: "day", icon: "wb_sunny" },
    day: { label: "Głosowanie", phase: "voting", icon: "how_to_vote" },
    voting: { label: "Następna Noc", phase: "night", icon: "bedtime" },
  };
  const nextPhase = nextPhaseMap[phase];

  const TABS = [
    { id: "phase" as const, icon: "swap_horiz", label: "Faza" },
    { id: "message" as const, icon: "mail", label: "Wiad." },
    { id: "mission" as const, icon: "task", label: "Misja" },
  ];

  return (
    <div className="mx-5 mt-5 rounded-xl bg-black/40 border border-primary/20 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors text-xs font-typewriter uppercase tracking-wider ${
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
        {/* Phase tab */}
        {tab === "phase" && (
          <div>
            {nextPhase ? (
              <button
                onClick={() => onPhase(nextPhase.phase)}
                disabled={phasePending}
                className="flex w-full items-center justify-center gap-2 rounded-lg h-12 bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.3)] active:scale-[0.98] disabled:opacity-50 font-typewriter uppercase tracking-wider text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">{nextPhase.icon}</span>
                {phasePending ? "Czekaj..." : nextPhase.label}
              </button>
            ) : (
              <p className="text-slate-500 text-sm font-typewriter text-center">
                Brak dostępnych przejść
              </p>
            )}
          </div>
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
            <textarea
              value={msnDesc}
              onChange={(e) => onMsnDescChange(e.target.value)}
              placeholder="Opis misji..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={msnSecret}
                  onChange={(e) => onMsnSecretChange(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-slate-400 text-sm font-typewriter">Tajna</span>
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-slate-500 text-sm font-typewriter">Punkty:</span>
                <input
                  type="number"
                  value={msnPoints}
                  min={0}
                  max={100}
                  onChange={(e) => onMsnPointsChange(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm font-typewriter text-center focus:outline-none focus:border-primary/50"
                />
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function MGMissions({
  token,
  players,
  onComplete,
}: {
  token: string;
  players: PublicPlayer[];
  onComplete: (id: string) => void;
}) {
  const [missions, setMissions] = useState<
    { id: string; playerId: string; description: string; isSecret: boolean; points: number }[]
  >([]);

  useEffect(() => {
    // Fetch active missions for all players (MG sees them)
    // We reuse the getState polling — this component just reads from parent state
    // Since we can't pass missions-per-player from parent easily, we skip for now
    // MG can see missions via each player's state
    void token; void players; void setMissions;
  }, [token, players]);

  void missions; void onComplete;
  return null; // MG mission management is done via the mission tab in MGPanel
}

// ---------------------------------------------------------------------------
function EndScreen({
  game,
  players,
  currentPlayer,
}: {
  game: GameStateResponse["game"];
  players: PublicPlayer[];
  currentPlayer: GameStateResponse["currentPlayer"];
}) {
  const winnerLabel = game.winner === "mafia" ? "Mafia wygrała!" : "Miasto wygrało!";
  const winnerIcon = game.winner === "mafia" ? "masks" : "groups";
  const winnerColor = game.winner === "mafia" ? "text-red-500" : "text-green-400";

  const isWinner =
    (game.winner === "mafia" && currentPlayer.role === "mafia") ||
    (game.winner === "town" && currentPlayer.role !== "mafia");

  return (
    <div className="mx-5 mt-5">
      <div className="p-6 rounded-xl bg-black/60 border border-primary/20 text-center">
        <span className={`material-symbols-outlined text-[56px] ${winnerColor} mb-3 block`}>
          {winnerIcon}
        </span>
        <p className={`font-typewriter text-2xl font-bold uppercase tracking-widest ${winnerColor} mb-2`}>
          {winnerLabel}
        </p>
        {!currentPlayer.isHost && (
          <p className={`font-typewriter text-sm uppercase tracking-wider ${isWinner ? "text-green-400" : "text-slate-500"}`}>
            {isWinner ? "Wygrałeś!" : "Przegrałeś"}
          </p>
        )}
      </div>

      <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mt-5 mb-3 pl-1">
        Role graczy
      </p>
      <div className="flex flex-col gap-2">
        {players
          .filter((p) => !p.isHost)
          .map((p) => (
            <div
              key={p.playerId}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                p.isAlive ? "border-slate-700 bg-black/20" : "border-slate-800 bg-black/10 opacity-50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${p.role ? ROLE_COLORS[p.role] : "text-slate-500"}`}
              >
                {p.role ? ROLE_ICONS[p.role] : "person"}
              </span>
              <span className="text-white text-sm flex-1">{p.nickname}</span>
              {p.isYou && <span className="text-xs text-primary font-typewriter">(ty)</span>}
              {p.role && (
                <span
                  className={`text-xs font-typewriter font-bold uppercase px-2 py-0.5 rounded border ${
                    p.role === "mafia"
                      ? "text-red-400 border-red-900/50 bg-red-950/30"
                      : p.role === "detective"
                      ? "text-blue-400 border-blue-900/50 bg-blue-950/30"
                      : p.role === "doctor"
                      ? "text-green-400 border-green-900/50 bg-green-950/30"
                      : "text-slate-400 border-slate-700 bg-slate-900/30"
                  }`}
                >
                  {ROLE_LABELS[p.role]}
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

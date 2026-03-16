"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import type { GameStateResponse, PublicPlayer } from "@/lib/db";
import { MISSION_PRESETS, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/missions-presets";

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<string, string> = {
  mafia: "Mafia",
  detective: "Detektyw",
  doctor: "Doktor",
  civilian: "Cywil",
  gm: "Mistrz Gry",
};
const ROLE_ICONS: Record<string, string> = {
  mafia: "masks",
  detective: "search",
  doctor: "medical_services",
  civilian: "person",
  gm: "manage_accounts",
};
const ROLE_COLORS: Record<string, string> = {
  mafia: "text-red-500",
  detective: "text-blue-400",
  doctor: "text-green-400",
  civilian: "text-slate-300",
  gm: "text-amber-400",
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

// Semantic confirmation text per role
const ACTION_CONFIRMED: Record<string, string> = {
  kill: "Wytypowałeś ofiarę:",
  investigate: "Przesłuchujesz:",
  protect: "Chronisz tej nocy:",
  vote: "Oskarżasz:",
  wait: "Czekasz w ukryciu...",
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
  const [mafiaCount, setMafiaCount] = useState(0); // 0 = auto

  // MG: message form
  const [msgTarget, setMsgTarget] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [msgPending, setMsgPending] = useState(false);
  const [msgError, setMsgError] = useState("");

  // MG: mission form
  const [msnTarget, setMsnTarget] = useState("");
  const [msnDesc, setMsnDesc] = useState("");
  const [msnSecret, setMsnSecret] = useState(false);
  const [msnPoints, setMsnPoints] = useState<1 | 2 | 3>(1);
  const [msnPreset, setMsnPreset] = useState<string>("custom");
  const [msnPending, setMsnPending] = useState(false);
  const [msnError, setMsnError] = useState("");

  // MG: transfer GM
  const [transferGmPending, setTransferGmPending] = useState(false);
  const [transferGmError, setTransferGmError] = useState("");

  // MG: rematch
  const [rematchPending, setRematchPending] = useState(false);

  // MG panel tab
  const [mgTab, setMgTab] = useState<"phase" | "message" | "mission" | "actions" | "gm">("phase");

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

      // Push new messages as toasts (client deduplicates by ID)
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
      const body = mafiaCount > 0 ? JSON.stringify({ mafiaCount }) : undefined;
      const res = await fetch(`/api/game/${token}/start`, {
        method: "POST",
        ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
      });
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
        body: JSON.stringify({ type: actionType, targetPlayerId: targetPlayerId || undefined }),
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
      else {
        setMsnDesc("");
        setMsnTarget("");
        setMsnSecret(false);
        setMsnPoints(1);
        setMsnPreset("custom");
      }
    } catch { setMsnError("Błąd połączenia"); }
    finally { setMsnPending(false); }
  }

  async function handleCompleteMission(missionId: string) {
    try {
      await fetch(`/api/game/${token}/mission/${missionId}/complete`, { method: "POST" });
      await fetchState();
    } catch { /* ignore */ }
  }

  async function handleTransferGm(newHostPlayerId: string) {
    setTransferGmPending(true);
    setTransferGmError("");
    try {
      const res = await fetch(`/api/game/${token}/transfer-gm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newHostPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) setTransferGmError(data.error ?? "Błąd");
      else await fetchState();
    } catch { setTransferGmError("Błąd połączenia"); }
    finally { setTransferGmPending(false); }
  }

  async function handleRematch() {
    setRematchPending(true);
    try {
      const res = await fetch(`/api/game/${token}/rematch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Błąd");
      else await fetchState();
    } catch { setError("Błąd połączenia"); }
    finally { setRematchPending(false); }
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
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark md:mx-auto md:my-8 md:rounded-[2.5rem]">
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
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark md:mx-auto md:my-8 md:rounded-[2.5rem]">
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
  const [changingDecision, setChangingDecision] = useState(false);
  const myAction = changingDecision ? null : state.myAction;

  // Reset changingDecision when phase changes
  useEffect(() => {
    setChangingDecision(false);
  }, [phase, game.round]);

  const actionTargets = players.filter((p) => p.isAlive && !p.isYou && !p.isHost);
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const joinUrl = `https://mafia-game-bev.pages.dev/?code=${game.code}`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-dark overflow-hidden shadow-2xl md:mx-auto md:my-8 md:rounded-[2.5rem]">
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
                <div className="flex items-center justify-between gap-3 mb-4">
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
                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 pt-3 border-t border-slate-800">
                  <p className="text-slate-600 text-xs font-typewriter uppercase tracking-widest mb-1">
                    Zeskanuj aby dołączyć
                  </p>
                  <div className="p-3 bg-white rounded-xl">
                    <QRCode
                      value={joinUrl}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#1a0c0c"
                    />
                  </div>
                  <p className="text-slate-700 text-[10px] font-typewriter text-center mt-1 break-all px-2">
                    {joinUrl}
                  </p>
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
                    {currentPlayer.role === "mafia" && (
                      <p className="text-red-400/70 text-xs font-typewriter mt-1">
                        🔴 Twoi wspólnicy są oznaczeni na liście
                      </p>
                    )}
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
            role={roleVisible ? currentPlayer.role : null}
            targets={actionTargets}
            myAction={myAction}
            pending={actionPending}
            error={actionError}
            onAction={(type, targetId) => {
              setChangingDecision(false);
              handleAction(type, targetId);
            }}
            roleHidden={!roleVisible}
            onChangeDecision={() => setChangingDecision(true)}
          />
        )}

        {/* ── VOTING: vote panel for players ── */}
        {isPlaying && !isHost && phase === "voting" && currentPlayer.isAlive && (
          <VotePanel
            targets={players.filter((p) => p.isAlive && !p.isYou)}
            myAction={myAction}
            pending={actionPending}
            error={actionError}
            onVote={(targetId) => {
              setChangingDecision(false);
              handleVote(targetId);
            }}
            onChangeDecision={() => setChangingDecision(true)}
          />
        )}

        {/* ── Mafia team actions (visible to mafia only) ── */}
        {state.mafiaTeamActions && state.mafiaTeamActions.length > 0 && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-red-950/20 border border-red-900/30">
            <p className="text-red-400/70 text-xs font-typewriter uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[12px] align-middle mr-1">group</span>
              Twoja rodzina
            </p>
            <div className="flex flex-col gap-1.5">
              {state.mafiaTeamActions.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-red-300/80">{a.nickname}</span>
                  <span className="text-slate-500">
                    → {a.targetNickname ?? <span className="italic text-slate-600">wybiera...</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Detective result card ── */}
        {detectiveResult && isPlaying && !isHost && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-blue-950/30 border border-blue-800/40">
            <p className="text-blue-400 text-xs font-typewriter uppercase tracking-widest mb-2">
              Wynik przesłuchania — Runda {detectiveResult.round}
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

        {/* ── PLAYING: day message for non-host ── */}
        {isPlaying && !isHost && phase === "day" && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
            <span className="material-symbols-outlined text-[28px] text-yellow-500/60 mb-1 block">wb_sunny</span>
            <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
              Dzień — dyskutujcie i szukajcie mafii
            </p>
          </div>
        )}

        {/* ── FINISHED: end screen ── */}
        {isFinished && (
          <EndScreen
            game={game}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            rematchPending={rematchPending}
            onRematch={handleRematch}
          />
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
            msnPreset={msnPreset}
            msnPending={msnPending}
            msnError={msnError}
            onMsnTargetChange={setMsnTarget}
            onMsnDescChange={setMsnDesc}
            onMsnSecretChange={setMsnSecret}
            onMsnPointsChange={setMsnPoints}
            onMsnPresetChange={setMsnPreset}
            onCreateMission={handleCreateMission}
            hostActions={state.hostActions}
            transferGmPending={transferGmPending}
            transferGmError={transferGmError}
            onTransferGm={handleTransferGm}
          />
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
                isFinished={isFinished}
                isHost={isHost}
                currentPlayerRole={currentPlayer.role}
                roleVisible={roleVisible}
              />
            ))}
          </div>
        </div>

        {/* ── Lobby: Transfer GM + Start button ── */}
        {isHost && isLobby && (
          <div className="mx-5 mt-6 flex flex-col gap-3">
            {players.length < 4 && (
              <p className="text-slate-500 text-sm font-typewriter text-center">
                Potrzeba minimum 4 graczy ({players.length}/4)
              </p>
            )}
            {/* Mafia count selector */}
            {players.length >= 4 && (
              <div className="p-4 rounded-xl bg-black/40 border border-slate-700">
                <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-2">
                  Liczba mafii
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMafiaCount(0)}
                    className={`px-3 py-2 rounded-lg text-sm font-typewriter uppercase tracking-wider border transition-all ${
                      mafiaCount === 0
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    Auto ({players.length <= 5 ? 1 : players.length <= 8 ? 2 : players.length <= 11 ? 3 : 4})
                  </button>
                  {Array.from({ length: Math.max(1, players.length - 3) }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setMafiaCount(n)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold font-typewriter border transition-all ${
                          mafiaCount === n
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>
                <p className="text-slate-600 text-xs mt-2">
                  + 1 policjant, 1 lekarz, reszta cywile
                </p>
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={starting || players.length < 4}
              className="flex w-full items-center justify-center rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-typewriter uppercase tracking-wider"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
            {/* Transfer GM in lobby */}
            <LobbyTransferGm
              players={nonHostPlayers}
              pending={transferGmPending}
              error={transferGmError}
              onTransfer={handleTransferGm}
            />
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
  isFinished,
  isHost,
  currentPlayerRole,
  roleVisible,
}: {
  player: PublicPlayer;
  isGamePlaying: boolean;
  isFinished: boolean;
  isHost: boolean;
  currentPlayerRole?: string | null;
  roleVisible?: boolean;
}) {
  // Determine if we show role badge and what color
  const showRoleBadge =
    isHost && isGamePlaying && player.role != null;

  // Mafia teammate indicator (visible when the current player is mafia and has revealed their role)
  const isMafiaTeammate =
    !isHost &&
    !player.isYou &&
    !player.isHost &&
    player.role === "mafia" &&
    currentPlayerRole === "mafia" &&
    roleVisible === true;

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
          {isMafiaTeammate && (
            <span className="text-xs" title="Członek mafii">🔴</span>
          )}
        </div>
        {!player.isAlive && (
          <span className="text-xs text-slate-600 font-typewriter uppercase">Wyeliminowany</span>
        )}
      </div>
      {showRoleBadge && player.role && (
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
      {/* End screen: show role for everyone when finished */}
      {isFinished && !isHost && player.role && (
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
  roleHidden = false,
  onChangeDecision,
}: {
  role: string | null;
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onAction: (type: string, targetId: string) => void;
  roleHidden?: boolean;
  onChangeDecision: () => void;
}) {
  const actionMap: Record<string, { type: string; label: string; icon: string; color: string }> = {
    mafia: { type: "kill", label: "Wytypuj ofiarę", icon: "skull", color: "text-red-400" },
    detective: { type: "investigate", label: "Kogo przesłuchać?", icon: "search", color: "text-blue-400" },
    doctor: { type: "protect", label: "Kogo chronić tej nocy?", icon: "medical_services", color: "text-green-400" },
  };

  // Civilian smoke screen
  const [progress, setProgress] = useState(0);
  const [smokeStarted, setSmokeStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCivilianWait() {
    if (smokeStarted || myAction) return;
    setSmokeStarted(true);
    const duration = 8000;
    const step = 100;
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += step;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current);
        onAction("wait", "");
      }
    }, step);
  }

  // Civilian confirmation — myAction with 'wait'
  if (myAction && myAction.actionType === "wait") {
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-slate-700">
        <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          Czekasz w ukryciu...
        </p>
        <p className="text-slate-600 text-sm">Ssssh. Udajesz że śpisz.</p>
      </div>
    );
  }

  if (myAction) {
    const targetName = targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ?? myAction.targetPlayerId;
    const actionLabel = roleHidden ? "Akcja wykonana" : (ACTION_CONFIRMED[myAction.actionType] ?? "Akcja wykonana");
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
        <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          {actionLabel}
        </p>
        {myAction.targetPlayerId && !roleHidden && (
          <p className="text-slate-300 text-sm">
            <span className="text-white font-medium">{targetName}</span>
          </p>
        )}
        {roleHidden && (
          <p className="text-slate-600 text-xs mt-1">Odkryj rolę by zobaczyć szczegóły</p>
        )}
        <button
          onClick={() => onChangeDecision()}
          className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 font-typewriter uppercase tracking-wider text-xs transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          Zmień decyzję
        </button>
      </div>
    );
  }

  // Civilian: show smoke screen
  if (role === "civilian") {
    return (
      <div className="mx-5 mt-4 p-5 rounded-xl bg-black/50 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[28px] text-slate-500">bedtime</span>
          <div>
            <p className="text-slate-300 font-typewriter text-sm uppercase tracking-widest">
              Zamknij oczy i czekaj...
            </p>
            <p className="text-slate-600 text-xs mt-0.5">Noc trwa. Nie zdradzaj swojej roli.</p>
          </div>
        </div>
        {smokeStarted ? (
          <div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-slate-600 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs font-typewriter text-center">
              {progress < 100 ? "Modlisz się w ciemności..." : "Zakończono"}
            </p>
          </div>
        ) : (
          <button
            onClick={startCivilianWait}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 font-typewriter uppercase tracking-wider text-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">self_improvement</span>
            Zacznij czekać
          </button>
        )}
      </div>
    );
  }

  const action = role ? actionMap[role] : null;
  if (!action) {
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
        <span className="material-symbols-outlined text-[28px] text-slate-600 mb-1 block">bedtime</span>
        <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
          Noc — czekaj na rozkazy
        </p>
        {roleHidden && (
          <p className="text-primary/60 text-xs mt-2 font-typewriter">
            ↑ Odkryj rolę aby wykonać akcję nocną
          </p>
        )}
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
  onChangeDecision,
}: {
  targets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  pending: boolean;
  error: string;
  onVote: (targetId: string) => void;
  onChangeDecision: () => void;
}) {
  if (myAction) {
    const targetName = targets.find((p) => p.playerId === myAction.targetPlayerId)?.nickname ?? myAction.targetPlayerId;
    return (
      <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
        <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
          Oskarżasz:
        </p>
        <p className="text-slate-300 text-sm">
          <span className="text-white font-medium">{targetName}</span>
        </p>
        <button
          onClick={() => onChangeDecision()}
          className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 font-typewriter uppercase tracking-wider text-xs transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          Zmień głos
        </button>
      </div>
    );
  }

  const alivePlayers = targets.filter((p) => p.isAlive);

  return (
    <div className="mx-5 mt-4">
      <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">how_to_vote</span>
        Kogo oskarżasz?
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
// MGPanel
// ---------------------------------------------------------------------------
const ACTION_ROLE_LABELS: Record<string, string> = {
  kill: "Eliminuje",
  investigate: "Sprawdza",
  protect: "Chroni",
  vote: "Głosuje na",
  wait: "Czeka",
};

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
  msnPreset,
  msnPending,
  msnError,
  onMsnTargetChange,
  onMsnDescChange,
  onMsnSecretChange,
  onMsnPointsChange,
  onMsnPresetChange,
  onCreateMission,
  hostActions,
  transferGmPending,
  transferGmError,
  onTransferGm,
}: {
  phase: string;
  players: PublicPlayer[];
  tab: "phase" | "message" | "mission" | "actions" | "gm";
  onTabChange: (t: "phase" | "message" | "mission" | "actions" | "gm") => void;
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
  msnPoints: 1 | 2 | 3;
  msnPreset: string;
  msnPending: boolean;
  msnError: string;
  onMsnTargetChange: (v: string) => void;
  onMsnDescChange: (v: string) => void;
  onMsnSecretChange: (v: boolean) => void;
  onMsnPointsChange: (v: 1 | 2 | 3) => void;
  onMsnPresetChange: (v: string) => void;
  onCreateMission: () => void;
  hostActions?: GameStateResponse["hostActions"];
  transferGmPending: boolean;
  transferGmError: string;
  onTransferGm: (playerId: string) => void;
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
    { id: "actions" as const, icon: "visibility", label: "Akcje" },
    { id: "gm" as const, icon: "manage_accounts", label: "GM" },
  ];

  // Handle preset selection
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

            {/* Preset dropdown */}
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
              onChange={(e) => { onMsnDescChange(e.target.value); onMsnPresetChange("custom"); }}
              placeholder="Opis misji..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-typewriter placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={msnSecret}
                  onChange={(e) => onMsnSecretChange(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-slate-400 text-sm font-typewriter">Tajna</span>
              </label>
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

        {/* Actions tab — real-time player actions */}
        {tab === "actions" && (
          <div>
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3">
              Akcje graczy — bieżąca faza
            </p>
            {!hostActions || hostActions.length === 0 ? (
              <p className="text-slate-600 text-sm font-typewriter text-center py-2">
                Brak akcji w tej fazie
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {hostActions.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/30 border border-slate-800">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">person</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-xs font-medium">{a.nickname}</span>
                      <span className="text-slate-500 text-xs mx-1">·</span>
                      <span className="text-slate-400 text-xs font-typewriter">
                        {ACTION_ROLE_LABELS[a.actionType] ?? a.actionType}
                        {a.targetNickname ? ` ${a.targetNickname}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GM transfer tab */}
        {tab === "gm" && (
          <div>
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3">
              Przekaż rolę MG innemu graczowi
            </p>
            {transferGmError && (
              <p className="text-red-400 text-xs font-typewriter mb-2">{transferGmError}</p>
            )}
            <div className="flex flex-col gap-2">
              {players.map((p) => (
                <button
                  key={p.playerId}
                  disabled={transferGmPending}
                  onClick={() => onTransferGm(p.playerId)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-black/20 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-40 text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <span className="text-white text-sm">{p.nickname}</span>
                  <span className="ml-auto text-xs text-slate-600 font-typewriter">→ MG</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lobby Transfer GM (shown in lobby for host)
// ---------------------------------------------------------------------------
function LobbyTransferGm({
  players,
  pending,
  error,
  onTransfer,
}: {
  players: PublicPlayer[];
  pending: boolean;
  error: string;
  onTransfer: (playerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (players.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 font-typewriter uppercase tracking-wider text-xs transition-all"
      >
        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
        Przekaż rolę MG
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-slate-700 bg-black/30 overflow-hidden">
          {error && <p className="text-red-400 text-xs font-typewriter px-3 pt-2">{error}</p>}
          {players.map((p) => (
            <button
              key={p.playerId}
              disabled={pending}
              onClick={() => { onTransfer(p.playerId); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-800 last:border-b-0 hover:bg-primary/5 transition-colors text-left disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500">person</span>
              <span className="text-white text-sm">{p.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EndScreen
// ---------------------------------------------------------------------------
function EndScreen({
  game,
  players,
  currentPlayer,
  isHost,
  rematchPending,
  onRematch,
}: {
  game: GameStateResponse["game"];
  players: PublicPlayer[];
  currentPlayer: GameStateResponse["currentPlayer"];
  isHost: boolean;
  rematchPending: boolean;
  onRematch: () => void;
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
        {!isHost && (
          <p className={`font-typewriter text-sm uppercase tracking-wider ${isWinner ? "text-green-400" : "text-slate-500"}`}>
            {isWinner ? "Wygrałeś!" : "Przegrałeś"}
          </p>
        )}
        {isHost && (
          <button
            onClick={onRematch}
            disabled={rematchPending}
            className="mt-4 flex items-center justify-center gap-2 mx-auto px-6 h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold font-typewriter uppercase tracking-wider text-sm transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] active:scale-[0.98] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            {rematchPending ? "Resetuję..." : "NASTĘPNA RUNDA"}
          </button>
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

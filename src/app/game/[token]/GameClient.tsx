"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import type { GameStateResponse, PublicPlayer } from "@/lib/db";
import { ROLE_LABELS, ROLE_COLORS, PHASE_LABELS, PHASE_ICONS, ROLE_ICONS } from "@/lib/constants";
import CharacterPicker from "@/components/CharacterPicker";
import OnboardingScreen from "./components/OnboardingScreen";
import PlayerRow from "./components/PlayerRow";
import MGPanel from "./components/MGPanel";
import NightActionPanel from "./components/NightActionPanel";
import VotePanel from "./components/VotePanel";
import EndScreen from "./components/EndScreen";

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
  const [phasePending, setPhasePending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mafiaCount, setMafiaCount] = useState(0);
  const [gameMode, setGameMode] = useState<"full" | "simple">("full");
  const [changingDecision, setChangingDecision] = useState(false);

  // Onboarding state
  const [characters, setCharacters] = useState<
    Array<{ id: string; slug: string; name: string; name_pl: string; avatar_url: string }>
  >([]);
  const [onboardingNickname, setOnboardingNickname] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

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

  // MG: rematch + settings
  const [rematchPending, setRematchPending] = useState(false);
  const [mafiaCountSetting, setMafiaCountSetting] = useState(0);
  const [mgTab, setMgTab] = useState<"game" | "message" | "mission" | "settings">("game");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Reset changingDecision when phase changes (must be before conditional returns!)
  const currentPhase = state?.game?.phase;
  const currentRound = state?.game?.round;
  useEffect(() => {
    setChangingDecision(false);
  }, [currentPhase, currentRound]);

  useEffect(() => {
    if (state?.currentPlayer?.character) {
      setSelectedCharacterId(state.currentPlayer.character.id);
    }
  }, [state?.currentPlayer?.character]);

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${token}/state`);
      if (res.status === 404) {
        setError("Sesja nie istnieje");
        return;
      }
      if (!res.ok) return;
      const data: GameStateResponse = await res.json();
      setState(data);
      for (const msg of data.messages) {
        if (!shownMessageIds.current.has(msg.id)) {
          shownMessageIds.current.add(msg.id);
          setToasts((prev) => [...prev, { id: msg.id, content: msg.content }]);
          setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== msg.id)), 7000);
        }
      }
    } catch {
      /* silent retry */
    }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => {
        if (r.ok) r.json().then(setCharacters);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showSettingsModal) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSettingsModal]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  async function handleStart() {
    setStarting(true);
    try {
      const bodyObj: Record<string, unknown> = { mode: gameMode };
      if (mafiaCount > 0) bodyObj.mafiaCount = mafiaCount;
      const res = await fetch(`/api/game/${token}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Błąd");
      else await fetchState();
    } catch {
      setError("Błąd połączenia");
    } finally {
      setStarting(false);
    }
  }

  async function handleOnboardingSetup() {
    if (!onboardingNickname.trim()) {
      setOnboardingError("Podaj swoje imię");
      return;
    }
    if (!selectedCharacterId) {
      setOnboardingError("Wybierz postać");
      return;
    }
    setOnboardingError("");
    setOnboardingLoading(true);
    try {
      const res = await fetch(`/api/game/${token}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: onboardingNickname.trim(),
          characterId: selectedCharacterId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOnboardingError(data.error ?? "Błąd");
        return;
      }
      await fetchState();
    } catch {
      setOnboardingError("Błąd połączenia");
    } finally {
      setOnboardingLoading(false);
    }
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
    } catch {
      setError("Błąd połączenia");
    } finally {
      setPhasePending(false);
    }
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
    } catch {
      setActionError("Błąd połączenia");
    } finally {
      setActionPending(false);
    }
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
      else {
        setMsgContent("");
        await fetchState();
      }
    } catch {
      setMsgError("Błąd połączenia");
    } finally {
      setMsgPending(false);
    }
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
    } catch {
      setMsnError("Błąd połączenia");
    } finally {
      setMsnPending(false);
    }
  }

  async function handleCompleteMission(missionId: string) {
    try {
      await fetch(`/api/game/${token}/mission/${missionId}/complete`, { method: "POST" });
      await fetchState();
    } catch {
      /* ignore */
    }
  }

  async function handleDeleteMission(missionId: string) {
    try {
      await fetch(`/api/game/${token}/mission/${missionId}`, { method: "DELETE" });
      await fetchState();
    } catch {
      /* ignore */
    }
  }

  async function handleLeaveGame() {
    if (!confirm("Czy na pewno chcesz opuścić grę?")) return;
    try {
      const res = await fetch(`/api/game/${token}/leave`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd");
        return;
      }
      router.push("/");
    } catch {
      setError("Błąd połączenia");
    }
  }

  async function handleTransferGm(newHostPlayerId: string) {
    try {
      const res = await fetch(`/api/game/${token}/transfer-gm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newHostPlayerId }),
      });
      if (res.ok) await fetchState();
    } catch {
      /* silent */
    }
  }

  async function handleKick(playerId: string) {
    try {
      const res = await fetch(`/api/game/${token}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) await fetchState();
    } catch {
      /* silent */
    }
  }

  async function handleGmAction(forPlayerId: string, actionType: string, targetPlayerId: string) {
    try {
      const res = await fetch(`/api/game/${token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: actionType,
          targetPlayerId: targetPlayerId || undefined,
          forPlayerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) setActionError(data.error ?? "Błąd");
      else await fetchState();
    } catch {
      setActionError("Błąd połączenia");
    }
  }

  async function handleRematch() {
    setRematchPending(true);
    try {
      const body =
        mafiaCountSetting > 0 ? JSON.stringify({ mafiaCount: mafiaCountSetting }) : undefined;
      const res = await fetch(`/api/game/${token}/rematch`, {
        method: "POST",
        ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Błąd");
      else await fetchState();
    } catch {
      setError("Błąd połączenia");
    } finally {
      setRematchPending(false);
    }
  }

  async function handleCharacterUpdate() {
    if (!selectedCharacterId) return;
    try {
      const res = await fetch(`/api/game/${token}/character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: selectedCharacterId }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        fetchState();
      }
    } catch {
      /* silent */
    }
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
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
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
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">
          refresh
        </span>
        <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
          Ładowanie...
        </p>
      </div>
    );
  }

  // Onboarding screen
  if (!state.currentPlayer.isSetupComplete && !state.currentPlayer.isHost) {
    return (
      <OnboardingScreen
        gameCode={state.game.code}
        characters={characters}
        onboardingNickname={onboardingNickname}
        selectedCharacterId={selectedCharacterId}
        onboardingLoading={onboardingLoading}
        onboardingError={onboardingError}
        takenCharacterIds={state.takenCharacterIds}
        onNicknameChange={setOnboardingNickname}
        onCharacterSelect={setSelectedCharacterId}
        onSubmit={handleOnboardingSetup}
      />
    );
  }

  const { game, currentPlayer, players, missions, detectiveResult } = state;
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const isPlaying = game.status === "playing";
  const isFinished = game.status === "finished";
  const phase = game.phase;
  const myAction = changingDecision ? null : state.myAction;
  const actionTargets = players.filter(
    (p) =>
      p.isAlive &&
      !p.isYou &&
      !p.isHost &&
      !(roleVisible && currentPlayer.role === "mafia" && p.role === "mafia")
  );
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?code=${game.code}`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-dark overflow-hidden">
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
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">
                  mail
                </span>
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
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/")}
            className="size-9 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <button
            onClick={() => router.push(`/ranking?token=${token}`)}
            className="size-9 flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors"
            title="Ranking sesji"
          >
            <span className="material-symbols-outlined text-[18px]">leaderboard</span>
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-typewriter text-white text-sm font-semibold">
            {PHASE_LABELS[phase]}
          </h2>
          {game.round > 0 && (
            <p className="text-slate-500 text-xs font-typewriter">Runda {game.round}</p>
          )}
        </div>
        <div className="size-9 flex items-center justify-center">
          {isHost ? (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-8 h-8 rounded-full border-2 border-primary/50 hover:border-primary transition-colors bg-primary/10 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                manage_accounts
              </span>
            </button>
          ) : currentPlayer.character ? (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-8 h-8 rounded-full border-2 border-slate-600 hover:border-slate-400 transition-colors overflow-hidden flex items-center justify-center"
            >
              {currentPlayer.character.avatarUrl ? (
                <>
                  <img
                    src={currentPlayer.character.avatarUrl}
                    alt={currentPlayer.character.namePl}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = "none";
                      const ph = t.parentElement?.querySelector(".header-placeholder");
                      if (ph) (ph as HTMLElement).style.display = "flex";
                    }}
                  />
                  <div className="header-placeholder hidden w-full h-full bg-primary/20 text-primary font-bold items-center justify-center text-xs">
                    {currentPlayer.character.namePl.charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                  {currentPlayer.character.namePl.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-8 h-8 rounded-full border-2 border-slate-600 hover:border-slate-400 transition-colors bg-slate-800 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-6">
        {/* ── LOBBY ── */}
        {isLobby && isHost && (
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
            <button
              onClick={() =>
                navigator.share
                  ? navigator
                      .share({
                        title: "Dołącz do Mafii!",
                        text: `Dołącz do gry Mafia! Kod: ${game.code}`,
                        url: joinUrl,
                      })
                      .catch(() => {})
                  : (navigator.clipboard.writeText(joinUrl),
                    setCopied(true),
                    setTimeout(() => setCopied(false), 2000))
              }
              className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-sm font-typewriter uppercase tracking-wider transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Udostępnij link
            </button>
            <div className="flex flex-col items-center gap-2 pt-3 border-t border-slate-800 mt-3">
              <p className="text-slate-600 text-xs font-typewriter uppercase tracking-widest mb-1">
                Zeskanuj aby dołączyć
              </p>
              <div className="p-3 bg-white rounded-xl">
                <QRCode value={joinUrl} size={160} bgColor="#ffffff" fgColor="#1a0c0c" />
              </div>
              <p className="text-slate-700 text-[10px] font-typewriter text-center mt-1 break-all px-2">
                {joinUrl}
              </p>
            </div>
          </div>
        )}
        {isLobby && !isHost && (
          <div className="mx-5 mt-5 p-5 rounded-xl bg-black/30 border border-slate-800 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary/60 mb-2 block animate-pulse">
              hourglass_empty
            </span>
            <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
              Czekaj na start
            </p>
            <p className="text-slate-600 text-xs mt-1">Mistrz gry niedługo rozpocznie rozgrywkę</p>
          </div>
        )}

        {/* ── PLAYING: role card ── */}
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

        {/* ── PLAYING: phase indicator (host) ── */}
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

        {/* ── NIGHT: action panel ── */}
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
            mafiaTeamActions={state.mafiaTeamActions}
            currentNickname={currentPlayer.nickname}
            onChangeDecision={() => setChangingDecision(true)}
          />
        )}

        {/* ── VOTING: vote panel ── */}
        {isPlaying && !isHost && phase === "voting" && currentPlayer.isAlive && (
          <VotePanel
            targets={players.filter((p) => p.isAlive && !p.isYou && !p.isHost)}
            myAction={myAction}
            pending={actionPending}
            error={actionError}
            onVote={(targetId) => {
              setChangingDecision(false);
              handleAction("vote", targetId);
            }}
            onChangeDecision={() => setChangingDecision(true)}
          />
        )}

        {/* ── DEAD PLAYER: spectator view ── */}
        {isPlaying && !isHost && !currentPlayer.isAlive && (
          <div className="mx-5 mt-5">
            <div className="p-5 rounded-xl bg-black/50 border border-slate-700 text-center mb-4">
              <span className="material-symbols-outlined text-[48px] text-slate-600 mb-2 block">
                skull
              </span>
              <p className="font-typewriter text-slate-400 text-lg uppercase tracking-widest">
                Nie żyjesz
              </p>
              <p className="text-slate-600 text-xs mt-2">
                Obserwujesz grę jako widz. Nie zdradzaj informacji żywym graczom!
              </p>
              {currentPlayer.role && (
                <p className="text-slate-500 text-xs mt-3 font-typewriter">
                  Byłeś:{" "}
                  <span
                    className={`font-bold ${ROLE_COLORS[currentPlayer.role] ?? "text-slate-300"}`}
                  >
                    {ROLE_LABELS[currentPlayer.role] ?? currentPlayer.role}
                  </span>
                </p>
              )}
            </div>
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
              <span className="material-symbols-outlined text-[12px] align-middle mr-1">
                visibility
              </span>
              Widok widza — role graczy
            </p>
            <div className="flex flex-col gap-2">
              {players
                .filter((p) => !p.isHost)
                .map((p) => (
                  <div
                    key={p.playerId}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-black/20 ${!p.isAlive ? "opacity-50" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${p.isAlive ? "border-slate-700 bg-slate-800" : "border-slate-800 bg-slate-900"}`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-500">
                        {p.isAlive ? "person" : "skull"}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium flex-1 ${p.isAlive ? "text-white" : "text-slate-600 line-through"}`}
                    >
                      {p.nickname}
                    </span>
                    {p.role && (
                      <span
                        className={`text-xs font-typewriter font-bold uppercase px-2 py-1 rounded border ${p.role === "mafia" ? "text-red-400 border-red-900/50 bg-red-950/30" : p.role === "detective" ? "text-blue-400 border-blue-900/50 bg-blue-950/30" : p.role === "doctor" ? "text-green-400 border-green-900/50 bg-green-950/30" : "text-slate-400 border-slate-700 bg-slate-900/30"}`}
                      >
                        {ROLE_LABELS[p.role] ?? p.role}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── VOTING: live tally ── */}
        {isPlaying && phase === "voting" && state.voteTally && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest">
                <span className="material-symbols-outlined text-[12px] align-middle mr-1">
                  how_to_vote
                </span>
                Głosy na żywo
              </p>
              <span className="text-slate-500 text-xs font-typewriter">
                {state.voteTally.votedCount}/{state.voteTally.totalVoters} oddanych
              </span>
            </div>
            {state.voteTally.results.length > 0 ? (
              <div className="flex flex-col gap-2">
                {state.voteTally.results.map((r, i) => (
                  <div key={r.playerId} className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium flex-1">{r.nickname}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${i === 0 ? "bg-primary" : "bg-slate-600"}`}
                        style={{ width: `${(r.votes / state.voteTally!.totalVoters) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold font-typewriter min-w-[2rem] text-right ${i === 0 ? "text-primary" : "text-slate-500"}`}
                    >
                      {r.votes}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs font-typewriter text-center">
                Nikt jeszcze nie zagłosował
              </p>
            )}
          </div>
        )}

        {/* ── Detective result ── */}
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
                  className={`text-sm font-typewriter font-bold ${detectiveResult.isMafia ? "text-red-400" : "text-green-400"}`}
                >
                  {detectiveResult.isMafia ? "MAFIA" : "NIE MAFIA"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Missions (non-host) ── */}
        {!isHost && missions.length > 0 && state.showPoints && (
          <div className="mx-5 mt-4">
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
              Twoje misje
            </p>
            <div className="flex flex-col gap-2">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border ${m.isCompleted ? "bg-green-950/20 border-green-900/40 opacity-70" : "bg-black/40 border-yellow-900/40"}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${m.isCompleted ? "text-green-400" : "text-yellow-500"}`}
                    >
                      {m.isCompleted ? "check_circle" : "task"}
                    </span>
                    <p
                      className={`text-sm flex-1 ${m.isCompleted ? "text-slate-400 line-through" : "text-white"}`}
                    >
                      {m.description}
                    </p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {m.points > 0 && (
                        <span
                          className={`text-xs font-typewriter font-bold ${m.isCompleted ? "text-green-400" : "text-yellow-400"}`}
                        >
                          +{m.points}pkt
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-typewriter uppercase tracking-wider ${m.isCompleted ? "text-green-500" : "text-slate-600"}`}
                      >
                        {m.isCompleted ? "✓ wykonana" : "⏳ w trakcie"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Day message ── */}
        {isPlaying && !isHost && phase === "day" && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
            <span className="material-symbols-outlined text-[28px] text-yellow-500/60 mb-1 block">
              wb_sunny
            </span>
            <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">
              Dzień — dyskutujcie i szukajcie mafii
            </p>
          </div>
        )}

        {/* ── REVIEW ── */}
        {isPlaying && phase === "review" && isHost && state.showPoints && (
          <div className="mx-5 mt-5 p-5 rounded-xl bg-amber-950/20 border border-amber-700/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[28px] text-amber-400">
                rate_review
              </span>
              <div>
                <p className="font-typewriter text-amber-400 text-sm font-bold uppercase tracking-widest">
                  Przegląd misji
                </p>
                <p className="text-slate-500 text-xs mt-0.5">Oceń misje przed zakończeniem rundy</p>
              </div>
            </div>
            {state.hostMissions
              ?.filter((m) => !m.isCompleted)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-black/30 border border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{m.playerNickname}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{m.description}</p>
                    <p className="text-slate-600 text-xs">{m.points} pkt</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCompleteMission(m.id)}
                      className="size-9 flex items-center justify-center rounded-lg bg-green-900/30 border border-green-700/40 text-green-400 hover:bg-green-900/50 transition-all"
                      title="Wykonana"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/game/${token}/mission/${m.id}`, { method: "DELETE" });
                        await fetchState();
                      }}
                      className="size-9 flex items-center justify-center rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 transition-all"
                      title="Niewykonana — usuń"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            {(!state.hostMissions ||
              state.hostMissions.filter((m) => !m.isCompleted).length === 0) && (
              <p className="text-green-400/60 text-xs font-typewriter text-center mb-3">
                ✓ Wszystkie misje ocenione
              </p>
            )}
            <button
              onClick={async () => {
                const res = await fetch(`/api/game/${token}/finalize`, { method: "POST" });
                if (res.ok) await fetchState();
              }}
              className="w-full mt-3 flex items-center justify-center gap-2 h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold font-typewriter uppercase tracking-wider transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)]"
            >
              <span className="material-symbols-outlined text-[20px]">emoji_events</span>
              Zakończ rundę
            </button>
          </div>
        )}
        {isPlaying && phase === "review" && !isHost && (
          <div className="mx-5 mt-5 p-5 rounded-xl bg-black/30 border border-slate-800 text-center">
            <span className="material-symbols-outlined text-[36px] text-amber-400/60 mb-2 block">
              hourglass_empty
            </span>
            <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
              MG ocenia misje...
            </p>
          </div>
        )}

        {/* ── FINISHED ── */}
        {isFinished && (
          <EndScreen
            game={game}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            rematchPending={rematchPending}
            onRematch={handleRematch}
            hostMissions={state.hostMissions}
            mafiaCountSetting={mafiaCountSetting}
          />
        )}

        {/* ── MG panel ── */}
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
            msnPoints={msnPoints}
            msnPreset={msnPreset}
            msnPending={msnPending}
            msnError={msnError}
            onMsnTargetChange={setMsnTarget}
            onMsnDescChange={setMsnDesc}
            onMsnPointsChange={setMsnPoints}
            onMsnPresetChange={setMsnPreset}
            onCreateMission={handleCreateMission}
            hostMissions={state.hostMissions}
            onCompleteMission={handleCompleteMission}
            onDeleteMission={handleDeleteMission}
            hostActions={state.hostActions}
            phaseProgress={state.phaseProgress}
            onGmAction={handleGmAction}
            onTransferGm={handleTransferGm}
            mafiaCountSetting={mafiaCountSetting}
            onMafiaCountSettingChange={setMafiaCountSetting}
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
                isLobby={isLobby}
                isHost={isHost}
                currentPlayerRole={currentPlayer.role}
                roleVisible={roleVisible}
                onKick={isLobby && isHost ? handleKick : undefined}
                onRename={undefined}
              />
            ))}
          </div>
        </div>

        {/* ── Lobby: start button ── */}
        {isHost && isLobby && (
          <div className="mx-5 mt-6 flex flex-col gap-3">
            {nonHostPlayers.length < (gameMode === "simple" ? 3 : 5) && (
              <p className="text-slate-500 text-sm font-typewriter text-center">
                Potrzeba minimum {gameMode === "simple" ? 3 : 5} graczy ({nonHostPlayers.length}/
                {gameMode === "simple" ? 3 : 5})
              </p>
            )}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-700">
              <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-2">
                Tryb gry
              </p>
              <div className="flex gap-2">
                {(["full", "simple"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-typewriter border transition-all text-center ${gameMode === mode ? "bg-primary/20 border-primary/50 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    <span className="block font-bold">
                      {mode === "full" ? "Pełny" : "Uproszczony"}
                    </span>
                    <span className="block text-xs opacity-60 mt-0.5">
                      {mode === "full" ? "Mafia + Policjant + Lekarz" : "Mafia vs Cywile"}
                    </span>
                    <span className="block text-xs opacity-40">
                      min. {mode === "full" ? 5 : 3} graczy
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {nonHostPlayers.length >= (gameMode === "simple" ? 3 : 5) && (
              <div className="p-4 rounded-xl bg-black/40 border border-slate-700">
                <p className="text-slate-400 text-xs font-typewriter uppercase tracking-widest mb-2">
                  Liczba mafii
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setMafiaCount(0)}
                    className={`px-3 py-2 rounded-lg text-sm font-typewriter uppercase tracking-wider border transition-all ${mafiaCount === 0 ? "bg-primary/20 border-primary/50 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    Auto (
                    {nonHostPlayers.length <= 5
                      ? 1
                      : nonHostPlayers.length <= 8
                        ? 2
                        : nonHostPlayers.length <= 11
                          ? 3
                          : 4}
                    )
                  </button>
                  {Array.from(
                    { length: Math.max(1, nonHostPlayers.length - 3) },
                    (_, i) => i + 1
                  ).map((n) => (
                    <button
                      key={n}
                      onClick={() => setMafiaCount(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold font-typewriter border transition-all ${mafiaCount === n ? "bg-primary/20 border-primary/50 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-slate-600 text-xs mt-2">
                  {gameMode === "full" ? "+ 1 policjant, 1 lekarz, reszta cywile" : "reszta cywile"}
                </p>
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={starting || nonHostPlayers.length < (gameMode === "simple" ? 3 : 5)}
              className="flex w-full items-center justify-center rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-typewriter uppercase tracking-wider"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
            <LobbyTransferGm players={nonHostPlayers} onTransfer={handleTransferGm} />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4 font-typewriter">Ustawienia gracza</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2 font-typewriter">Nazwa</label>
                <input
                  type="text"
                  value={state?.currentPlayer?.nickname || ""}
                  readOnly
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              {characters.length > 0 && !currentPlayer.isHost && (
                <div>
                  <label className="block text-slate-400 text-sm mb-3 font-typewriter">
                    Postać
                  </label>
                  <CharacterPicker
                    characters={characters}
                    selectedId={selectedCharacterId}
                    onSelect={setSelectedCharacterId}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-typewriter transition-colors"
              >
                Anuluj
              </button>
              {!currentPlayer.isHost && (
                <button
                  onClick={handleCharacterUpdate}
                  disabled={
                    !selectedCharacterId ||
                    selectedCharacterId === state?.currentPlayer?.character?.id
                  }
                  className="flex-1 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded font-typewriter transition-colors"
                >
                  Zapisz
                </button>
              )}
            </div>
            {!currentPlayer.isHost && (
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  handleLeaveGame();
                }}
                className="w-full mt-4 py-2 bg-red-900/50 hover:bg-red-800/50 border border-red-700/50 text-red-300 rounded font-typewriter transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Opuść grę
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LobbyTransferGm — local helper component
// ---------------------------------------------------------------------------
function LobbyTransferGm({
  players,
  onTransfer,
}: {
  players: PublicPlayer[];
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
          {players.map((p) => (
            <button
              key={p.playerId}
              onClick={() => {
                onTransfer(p.playerId);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-800 last:border-b-0 hover:bg-primary/5 transition-colors text-left"
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

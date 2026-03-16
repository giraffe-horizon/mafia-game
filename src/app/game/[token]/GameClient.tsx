"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { GameStateResponse } from "@/lib/store";

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

export default function GameClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [roleVisible, setRoleVisible] = useState(false);
  const [copied, setCopied] = useState(false);

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
    } catch {
      // silent — will retry
    }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/game/${token}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd");
      } else {
        await fetchState();
      }
    } catch {
      setError("Błąd połączenia");
    } finally {
      setStarting(false);
    }
  }

  function copyCode() {
    if (!state) return;
    navigator.clipboard.writeText(state.game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <div className="flex min-h-[844px] w-full max-w-[390px] flex-col items-center justify-center bg-background-dark mx-auto sm:my-8 sm:rounded-[2.5rem] border border-slate-800">
        <span className="material-symbols-outlined text-[48px] text-primary mb-4">
          error
        </span>
        <p className="text-slate-300 font-typewriter text-lg text-center px-8">
          {error}
        </p>
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
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">
          refresh
        </span>
        <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
          Ładowanie...
        </p>
      </div>
    );
  }

  const { game, currentPlayer, players } = state;
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const isPlaying = game.status === "playing";

  return (
    <div className="relative flex min-h-[844px] w-full max-w-[390px] flex-col bg-background-dark overflow-hidden border border-slate-800 shadow-2xl mx-auto sm:my-8 sm:rounded-[2.5rem]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
        <button onClick={() => router.push("/")} className="size-10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="font-typewriter text-primary text-base font-bold tracking-widest drop-shadow-[0_0_6px_rgba(218,11,11,0.5)]">MAFIA</h2>
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest">
            {PHASE_LABELS[game.phase]}{game.round > 0 && ` · Runda ${game.round}`}
          </p>
        </div>
        <div className="size-10 flex items-center justify-center">
          <span className={`text-xs font-typewriter px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${isHost ? "text-primary border-primary/40 bg-primary/10" : "text-slate-400 border-slate-700 bg-slate-800/50"}`}>
            {isHost ? "MG" : "Gracz"}
          </span>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {isHost && isLobby && (
          <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-primary/20">
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2">Kod sesji — udostępnij graczom</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-typewriter text-2xl font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(218,11,11,0.3)]">{game.code}</span>
              <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-typewriter uppercase tracking-wider transition-all">
                <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Skopiowano" : "Kopiuj"}
              </button>
            </div>
          </div>
        )}
        {isPlaying && !isHost && (
          <div className="mx-5 mt-5">
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">Twoja rola</p>
            <button onClick={() => setRoleVisible((v) => !v)} className="w-full p-5 rounded-xl bg-black/60 border border-primary/20 hover:border-primary/40 transition-all active:scale-[0.98]">
              {roleVisible ? (
                <div className="flex items-center gap-4">
                  <span className={`material-symbols-outlined text-[48px] ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}>{ROLE_ICONS[currentPlayer.role ?? "civilian"]}</span>
                  <div className="text-left">
                    <p className={`font-typewriter text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}>{ROLE_LABELS[currentPlayer.role ?? "civilian"]}</p>
                    <p className="text-slate-500 text-sm mt-1">Stuknij aby ukryć</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="material-symbols-outlined text-[32px] text-slate-600">visibility_off</span>
                  <p className="font-typewriter text-slate-500 uppercase tracking-widest text-sm">Stuknij aby zobaczyć rolę</p>
                </div>
              )}
            </button>
          </div>
        )}
        {isPlaying && isHost && (
          <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-slate-700">
            <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3">Faza gry</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px] text-primary">{game.phase === "night" ? "bedtime" : game.phase === "day" ? "wb_sunny" : "how_to_vote"}</span>
              <span className="font-typewriter text-xl font-bold text-white uppercase tracking-wider">{PHASE_LABELS[game.phase]}</span>
            </div>
          </div>
        )}
        <div className="mx-5 mt-5 flex-1">
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3 pl-1">Gracze ({players.length})</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <div key={p.nickname} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${p.isYou ? "border-primary/40 bg-primary/5" : "border-slate-800 bg-black/20"} ${!p.isAlive ? "opacity-40" : ""}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${p.isHost ? "border-primary/50 bg-primary/10" : "border-slate-700 bg-slate-800"}`}>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">{p.isHost ? "manage_accounts" : "person"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{p.nickname}</span>
                    {p.isYou && <span className="text-xs text-primary font-typewriter">(ty)</span>}
                    {p.isHost && <span className="text-xs text-primary/70 font-typewriter uppercase">MG</span>}
                  </div>
                  {!p.isAlive && <span className="text-xs text-slate-600 font-typewriter uppercase">Wyeliminowany</span>}
                </div>
                {p.role && (isHost || p.isYou) && (
                  <span className={`text-xs font-typewriter font-bold uppercase px-2 py-1 rounded border ${p.role === "mafia" ? "text-red-400 border-red-900/50 bg-red-950/30" : p.role === "detective" ? "text-blue-400 border-blue-900/50 bg-blue-950/30" : p.role === "doctor" ? "text-green-400 border-green-900/50 bg-green-950/30" : "text-slate-400 border-slate-700 bg-slate-900/30"}`}>
                    {ROLE_LABELS[p.role]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        {isHost && isLobby && (
          <div className="mx-5 mt-6 mb-8">
            {players.length < 4 && <p className="text-slate-500 text-sm font-typewriter text-center mb-3">Potrzeba minimum 4 graczy ({players.length}/4)</p>}
            <button onClick={handleStart} disabled={starting || players.length < 4} className="flex w-full items-center justify-center rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-typewriter uppercase tracking-wider">
              <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
              {starting ? "Startuję..." : "Rozpocznij grę"}
            </button>
          </div>
        )}
        {!isHost && isLobby && (
          <div className="mx-5 mt-6 mb-8 p-5 rounded-xl bg-black/30 border border-slate-800 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary/60 mb-2 block animate-pulse">hourglass_empty</span>
            <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">Czekaj na start</p>
            <p className="text-slate-600 text-xs mt-1">Mistrz gry niedługo rozpocznie rozgrywkę</p>
          </div>
        )}
        {!isHost && isPlaying && (
          <div className="mx-5 mt-4 mb-8 p-4 rounded-xl bg-black/30 border border-slate-800 text-center">
            <p className="text-slate-500 font-typewriter uppercase tracking-widest text-xs">Gra trwa — słuchaj poleceń MG</p>
          </div>
        )}
      </div>
    </div>
  );
}

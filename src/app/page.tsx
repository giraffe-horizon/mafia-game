"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";

export default function Home() {
  const router = useRouter();
  const { nickname, setNickname } = useGameStore();
  const [localNickname, setLocalNickname] = useState(nickname);
  const [joinMode, setJoinMode] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocalNickname(nickname);
  }, [nickname]);

  async function handleCreate() {
    if (!localNickname.trim()) {
      setError("Podaj swoje imię");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: localNickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd");
        return;
      }
      setNickname(localNickname.trim());
      router.push(`/game/${data.token}`);
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinMode) {
      setJoinMode(true);
      return;
    }
    if (!localNickname.trim()) {
      setError("Podaj swoje imię");
      return;
    }
    if (!sessionCode.trim()) {
      setError("Podaj kod sesji");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: localNickname.trim(),
          code: sessionCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd");
        return;
      }
      setNickname(localNickname.trim());
      router.push(`/game/${data.token}`);
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[844px] w-full max-w-[390px] flex-col bg-background-light dark:bg-background-dark group overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl mx-auto sm:my-8 sm:rounded-[2.5rem]">
      {/* Noir atmospheric background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/40 via-background-dark/70 to-background-dark z-10" />
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 30%, rgba(218,11,11,0.15) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(50,0,0,0.8) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center p-4 pb-2 justify-between">
        <div className="size-12 shrink-0 opacity-0 pointer-events-none" />
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-typewriter text-primary drop-shadow-[0_0_8px_rgba(218,11,11,0.5)]">
          MAFIA
        </h2>
        <div className="size-12 shrink-0" />
      </div>

      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        {/* Hero icon */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background-dark/80 shadow-[0_0_30px_rgba(218,11,11,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            <span className="material-symbols-outlined text-[64px] text-primary relative z-10 drop-shadow-md">
              local_police
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-white tracking-tight text-[40px] font-bold leading-none text-center pb-8 font-typewriter drop-shadow-md uppercase">
          Witamy w
          <br />
          <span className="text-primary text-[48px] drop-shadow-[0_0_12px_rgba(218,11,11,0.6)]">
            Mieście
          </span>
        </h1>

        {/* Inputs */}
        <div className="flex flex-col gap-3 w-full mb-6">
          <label className="flex flex-col w-full group/input">
            <p className="text-slate-400 text-sm font-typewriter leading-normal pb-2 uppercase tracking-widest pl-1 transition-colors group-focus-within/input:text-primary">
              Podaj swoje imię
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
              </span>
              <input
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/30 bg-black/40 backdrop-blur-sm h-14 placeholder:text-slate-600 pl-12 pr-4 text-lg font-medium leading-normal transition-all"
                placeholder="Detektyw..."
                type="text"
                value={localNickname}
                onChange={(e) => setLocalNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (joinMode ? handleJoin() : handleCreate())}
              />
            </div>
          </label>

          {joinMode && (
            <label className="flex flex-col w-full group/input">
              <p className="text-slate-400 text-sm font-typewriter leading-normal pb-2 uppercase tracking-widest pl-1 transition-colors group-focus-within/input:text-primary">
                Kod sesji
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">
                    tag
                  </span>
                </span>
                <input
                  className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/30 bg-black/40 backdrop-blur-sm h-14 placeholder:text-slate-600 pl-12 pr-4 text-lg font-medium uppercase tracking-widest transition-all"
                  placeholder="MAFIA-XXXX"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  autoFocus
                />
              </div>
            </label>
          )}

          {error && (
            <p className="text-primary text-sm font-typewriter pl-1 animate-pulse">
              {error}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 w-full mt-auto">
          {!joinMode && (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold leading-normal tracking-[0.02em] transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] hover:shadow-[0_6px_20px_rgba(218,11,11,0.23)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">
                add_circle
              </span>
              <span className="truncate uppercase font-typewriter tracking-wider">
                {loading ? "Tworzę..." : "Stwórz grę"}
              </span>
            </button>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-transparent border-2 border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-lg font-bold leading-normal tracking-[0.02em] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">
              login
            </span>
            <span className="truncate uppercase font-typewriter tracking-wider">
              {joinMode
                ? loading
                  ? "Dołączam..."
                  : "Wejdź do gry"
                : "Dołącz do gry"}
            </span>
          </button>

          {joinMode && (
            <button
              onClick={() => {
                setJoinMode(false);
                setSessionCode("");
                setError("");
              }}
              className="text-slate-500 hover:text-slate-300 text-sm font-typewriter uppercase tracking-widest transition-colors text-center"
            >
              ← Wróć
            </button>
          )}
        </div>
      </div>

      <div className="h-8 relative z-20" />
    </div>
  );
}

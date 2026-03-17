"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";

function CodeInput({
  value,
  onChange,
  onComplete,
  length,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
  length: number;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(length, "").split("").slice(0, length);

  const handleChange = useCallback(
    (index: number, rawValue: string) => {
      const cleaned = rawValue.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (!cleaned) return;

      // Multi-char = paste via onChange (some browsers don't fire onPaste)
      if (cleaned.length > 1) {
        const pasted = cleaned.slice(0, length);
        onChange(pasted);
        const focusIdx = Math.min(pasted.length, length - 1);
        setTimeout(() => inputRefs.current[focusIdx]?.focus(), 50);
        if (pasted.length === length) {
          setTimeout(() => onComplete(), 100);
        }
        return;
      }

      const newChars = [...chars];
      newChars[index] = cleaned[0];
      const newValue = newChars.join("").replace(/ /g, "");
      onChange(newValue);
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      if (newValue.length === length) {
        setTimeout(() => onComplete(), 50);
      }
    },
    [chars, onChange, onComplete, length]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const newChars = [...chars];
        if (chars[index] && chars[index] !== " ") {
          newChars[index] = " ";
          onChange(newChars.join("").trimEnd());
        } else if (index > 0) {
          newChars[index - 1] = " ";
          onChange(newChars.join("").trimEnd());
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "Enter" && value.length === length) {
        onComplete();
      }
    },
    [chars, onChange, onComplete, value, length]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, length);
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, length - 1);
      setTimeout(() => inputRefs.current[focusIdx]?.focus(), 50);
      if (pasted.length === length) {
        setTimeout(() => onComplete(), 100);
      }
    },
    [onChange, onComplete, length]
  );

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          maxLength={1}
          value={chars[i]?.trim() || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoFocus={i === 0}
          className="w-12 h-14 text-center text-xl font-bold font-typewriter uppercase rounded-lg bg-black/40 border border-primary/30 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      ))}
    </div>
  );
}

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

  // Auto-fill ?code= from URL (e.g. from QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setSessionCode(code.toUpperCase());
      setJoinMode(true);
    }
  }, []);

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
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-light dark:bg-background-dark group overflow-hidden shadow-2xl md:mx-auto md:my-8 md:rounded-[2.5rem]">
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
                <span className="material-symbols-outlined text-[20px]">person</span>
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
            <div className="flex flex-col w-full">
              <p className="text-slate-400 text-sm font-typewriter leading-normal pb-2 uppercase tracking-widest pl-1">
                Kod sesji
              </p>
              <CodeInput
                value={sessionCode}
                onChange={setSessionCode}
                onComplete={handleJoin}
                length={6}
              />
            </div>
          )}

          {error && (
            <p className="text-primary text-sm font-typewriter pl-1 animate-pulse">{error}</p>
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
              <span className="material-symbols-outlined mr-2 text-[20px]">add_circle</span>
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
            <span className="material-symbols-outlined mr-2 text-[20px]">login</span>
            <span className="truncate uppercase font-typewriter tracking-wider">
              {joinMode ? (loading ? "Dołączam..." : "Wejdź do gry") : "Dołącz do gry"}
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
    </div>
  );
}

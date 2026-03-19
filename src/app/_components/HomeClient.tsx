"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as apiClient from "@/lib/api-client";

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
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length }, (_, i) => (
        <input
          key={`char-${i}`}
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
          className="w-11 h-13 text-center text-xl font-bold font-display uppercase bg-surface-low border border-on-surface/20 text-on-surface focus:outline-none focus:border-stamp focus:bg-stamp/5"
        />
      ))}
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const [joinMode, setJoinMode] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      setSessionCode(code.toUpperCase());
      setJoinMode(true);
      handleJoinWithCode(code.toUpperCase());
    }
  }, []);

  async function handleCreate() {
    setError("");
    setLoading(true);
    try {
      const data = await apiClient.createGame();
      router.push(`/game/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinWithCode(code: string) {
    if (!code.trim()) {
      setError("Podaj kod sesji");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiClient.joinGame({ code: code.trim() });
      router.push(`/game/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinMode) {
      setJoinMode(true);
      return;
    }
    await handleJoinWithCode(sessionCode);
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Create game */}
      {!joinMode && (
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full h-14 bg-stamp text-on-paper font-display font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 border-2 border-stamp hover:bg-stamp/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          {loading ? "Tworzę..." : "Nowa operacja"}
        </button>
      )}

      {/* Join area — dashed border dossier */}
      <div className="border border-dashed border-on-surface/20 p-4">
        <p className="text-on-surface/30 font-display font-bold uppercase tracking-widest text-[10px] mb-3 text-center">
          {joinMode ? "Wpisz kod operacji" : "Dołącz do operacji"}
        </p>

        {joinMode && (
          <div className="mb-4">
            <CodeInput
              value={sessionCode}
              onChange={setSessionCode}
              onComplete={handleJoin}
              length={6}
            />
          </div>
        )}

        {error && (
          <p className="text-stamp text-xs font-display text-center mb-3 uppercase tracking-wider">
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full h-12 border border-on-surface/25 text-on-surface font-display font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:border-on-surface/50 hover:bg-on-surface/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          {joinMode ? (loading ? "Dołączam..." : "Wejdź") : "Dołącz"}
        </button>

        {joinMode && (
          <button
            onClick={() => {
              setJoinMode(false);
              setSessionCode("");
              setError("");
            }}
            className="w-full mt-2 text-on-surface/30 text-xs font-display uppercase tracking-widest text-center hover:text-on-surface/60"
          >
            ← Wróć
          </button>
        )}
      </div>
    </div>
  );
}

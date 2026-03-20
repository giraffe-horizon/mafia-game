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
          className="text-center text-xl font-bold font-display uppercase bg-transparent border-[2.5px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          style={{
            width: "48px",
            height: "52px",
            borderColor: "#3A3A30",
            borderRadius: "4px",
            color: "#2B2B2B",
          }}
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

  // Auto-fill ?code= from URL (e.g. from QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      setSessionCode(code.toUpperCase());
      setJoinMode(true);
      // Auto-join immediately
      handleJoinWithCode(code.toUpperCase());
    }
  }, []);

  async function handleCreate() {
    setError("");
    setLoading(true);
    try {
      const data = await apiClient.createGame();
      router.push(`/game/${data.token}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd połączenia");
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd połączenia");
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
    <>
      {/* Inputs */}
      {joinMode && (
        <div
          className="flex flex-col gap-3 w-full mb-6 p-4"
          style={{ border: "2px dashed #5A5A4A" }}
        >
          <p
            className="text-xs font-display leading-normal uppercase tracking-widest"
            style={{ color: "#6B6B5A" }}
          >
            KOD SESJI
          </p>
          <CodeInput
            value={sessionCode}
            onChange={setSessionCode}
            onComplete={handleJoin}
            length={6}
          />
          {error && (
            <p
              className="text-sm font-display animate-pulse text-center"
              style={{ color: "#D94F3B" }}
            >
              {error}
            </p>
          )}
        </div>
      )}
      {!joinMode && (
        <div className="w-full mb-6">
          {error && (
            <p className="text-sm font-display pl-1 animate-pulse" style={{ color: "#D94F3B" }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full mt-auto">
        {!joinMode && (
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden h-14 font-bold leading-normal transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#D94B3E",
              color: "white",
              fontSize: "20px",
              borderRadius: "0",
            }}
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">add_circle</span>
            <span className="truncate uppercase font-display tracking-wider">
              {loading ? "Tworzę..." : "STWÓRZ GRĘ"}
            </span>
          </button>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center overflow-hidden h-14 bg-transparent border-[2.5px] font-bold leading-normal transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            borderColor: "#3A3A30",
            color: "#2B2B2B",
            fontSize: "18px",
          }}
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">login</span>
          <span className="truncate uppercase font-display tracking-wider">
            {joinMode ? (loading ? "Dołączam..." : "WEJDŹ DO GRY") : "DOŁĄCZ DO GRY"}
          </span>
        </button>

        {joinMode && (
          <button
            onClick={() => {
              setJoinMode(false);
              setSessionCode("");
              setError("");
            }}
            className="text-sm font-display uppercase tracking-widest transition-colors text-center"
            style={{ color: "#6B6B5A" }}
          >
            ← Wróć
          </button>
        )}
      </div>
    </>
  );
}

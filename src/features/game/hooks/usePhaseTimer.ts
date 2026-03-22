"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "@/features/game/store/gameStore";

interface PhaseTimerReturn {
  remainingMs: number;
  remainingFormatted: string;
  isExpired: boolean;
  isActive: boolean;
  progress: number; // 0..1 (1 = full time remaining)
}

function formatMs(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Countdown hook synchronized with server-provided deadline.
 * Uses requestAnimationFrame for smooth display, corrects drift from WS timer messages.
 */
export function usePhaseTimer(): PhaseTimerReturn {
  const phaseDeadline = useGameStore((s) => s.phaseDeadline);
  const serverRemainingMs = useGameStore((s) => s.serverRemainingMs);

  const [remainingMs, setRemainingMs] = useState(0);
  const rafRef = useRef<number>(0);
  const deadlineRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);

  // Sync with server deadline / remaining
  const syncWithServer = useCallback(() => {
    if (!phaseDeadline) {
      deadlineRef.current = 0;
      totalDurationRef.current = 0;
      setRemainingMs(0);
      return;
    }

    const deadlineTs = new Date(phaseDeadline).getTime();

    // Use serverRemainingMs to calibrate (avoids client clock drift)
    if (serverRemainingMs != null && serverRemainingMs > 0) {
      deadlineRef.current = Date.now() + serverRemainingMs;
    } else {
      deadlineRef.current = deadlineTs;
    }

    // Estimate total duration (for progress bar) — first sync sets it
    if (totalDurationRef.current === 0) {
      totalDurationRef.current = deadlineRef.current - Date.now();
    }

    setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
  }, [phaseDeadline, serverRemainingMs]);

  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  // RAF countdown loop
  useEffect(() => {
    if (!phaseDeadline) return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadlineRef.current - now);
      setRemainingMs(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phaseDeadline]);

  const isActive = phaseDeadline !== null;
  const isExpired = isActive && remainingMs <= 0;
  const progress =
    isActive && totalDurationRef.current > 0
      ? Math.max(0, Math.min(1, remainingMs / totalDurationRef.current))
      : 0;

  return {
    remainingMs,
    remainingFormatted: formatMs(remainingMs),
    isExpired,
    isActive,
    progress,
  };
}

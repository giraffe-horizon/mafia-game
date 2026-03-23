"use client";

import { useEffect, useRef } from "react";
import { usePhaseTimer } from "@/features/game/hooks/usePhaseTimer";
import { useGameStore } from "@/features/game/store/gameStore";
import * as sounds from "@/lib/sounds";

function getTimerColor(progress: number): string {
  if (progress > 0.5) return "text-emerald-400";
  if (progress > 0.25) return "text-yellow-400";
  return "text-red-400";
}

function getBarColor(progress: number): string {
  if (progress > 0.5) return "bg-emerald-400";
  if (progress > 0.25) return "bg-yellow-400";
  return "bg-red-400";
}

export default function PhaseTimer() {
  const { remainingMs, remainingFormatted, isExpired, isActive, progress } = usePhaseTimer();
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const soundVolume = useGameStore((s) => s.soundVolume);

  const lastTickRef = useRef(0);
  const expiredFiredRef = useRef(false);

  // Warning vibration + ticking sound at <10s
  useEffect(() => {
    if (!isActive || isExpired) return;

    const remainingSec = Math.ceil(remainingMs / 1000);

    // Ticking sound every second when <10s
    if (remainingSec <= 10 && remainingSec > 0) {
      const now = Date.now();
      if (now - lastTickRef.current >= 900) {
        lastTickRef.current = now;
        if (soundEnabled) {
          sounds.timerWarning(soundVolume);
        }
        // Vibration buzz every 5 seconds
        if (remainingSec % 5 === 0) {
          try {
            navigator.vibrate?.(50);
          } catch {
            // ignore
          }
        }
      }
    }
  }, [remainingMs, isActive, isExpired, soundEnabled, soundVolume]);

  // Expired: long buzz + alarm sound
  useEffect(() => {
    if (isExpired && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      if (soundEnabled) {
        sounds.timerExpired(soundVolume);
      }
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        // ignore
      }
    }
    if (!isExpired) {
      expiredFiredRef.current = false;
    }
  }, [isExpired, soundEnabled, soundVolume]);

  if (!isActive) return null;

  const shouldPulse = !isExpired && remainingMs < 10000;

  return (
    <div className="flex items-center gap-2 px-3 py-1">
      {/* Timer display */}
      <span
        className={`font-mono text-sm font-bold tracking-wider ${getTimerColor(progress)} ${
          shouldPulse ? "animate-pulse" : ""
        }`}
      >
        {isExpired ? "0:00" : remainingFormatted}
      </span>

      {/* Progress bar */}
      <div className="flex-1 h-1 bg-surface-highest overflow-hidden min-w-[40px] max-w-[80px]">
        <div
          className={`h-full transition-all duration-200 ${getBarColor(progress)} ${
            shouldPulse ? "animate-pulse" : ""
          }`}
          style={{ width: `${Math.max(0, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

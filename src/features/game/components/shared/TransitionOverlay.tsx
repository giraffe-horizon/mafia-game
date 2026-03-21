"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/features/game/store/gameStore";

function triggerVibration(screen: { title: string; subtitle?: string }) {
  try {
    if (!navigator.vibrate) return;
    const text = `${screen.title} ${screen.subtitle ?? ""}`.toLowerCase();
    const isDeathScreen =
      text.includes("nie przeżył") || text.includes("wyeliminowan") || text.includes("wyrok");
    if (isDeathScreen) {
      navigator.vibrate([100, 50, 100]);
    } else {
      navigator.vibrate(200);
    }
  } catch {
    // Vibration API not supported
  }
}

export default function TransitionOverlay() {
  const transition = useGameStore((s) => s.transition);
  const clearTransition = useGameStore((s) => s.clearTransition);
  const isHost = useGameStore((s) => s.state?.currentPlayer?.isHost ?? false);

  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  const advanceOrClose = useCallback(() => {
    if (!transition) return;

    if (currentScreenIndex < transition.screens.length - 1) {
      setFadeState("out");
      setTimeout(() => {
        setCurrentScreenIndex((i) => i + 1);
        setFadeState("in");
      }, 300);
    } else {
      setFadeState("out");
      setTimeout(() => {
        clearTransition();
      }, 300);
    }
  }, [transition, currentScreenIndex, clearTransition]);

  // Auto-advance timer
  useEffect(() => {
    if (!transition) return;

    const screen = transition.screens[currentScreenIndex];
    if (!screen) return;

    const timer = setTimeout(advanceOrClose, screen.durationMs);
    return () => clearTimeout(timer);
  }, [transition, currentScreenIndex, advanceOrClose]);

  // Reset state when a new transition starts + vibrate
  useEffect(() => {
    if (transition) {
      setCurrentScreenIndex(0);
      setFadeState("in");
      triggerVibration(transition.screens[0]);
    }
  }, [transition]);

  // Vibrate on screen change (after the first screen)
  useEffect(() => {
    if (transition && currentScreenIndex > 0) {
      triggerVibration(transition.screens[currentScreenIndex]);
    }
  }, [transition, currentScreenIndex]);

  if (!transition) return null;

  const screen = transition.screens[currentScreenIndex];
  if (!screen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/95 backdrop-blur-sm"
      onClick={isHost ? undefined : advanceOrClose}
    >
      <div
        className={`flex flex-col items-center gap-4 px-8 text-center transition-all duration-300 ease-out ${
          fadeState === "in"
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <span className="material-symbols-outlined text-[64px] text-primary animate-pulse">
          {screen.icon}
        </span>
        <h1 className="font-display text-3xl font-bold uppercase tracking-widest text-on-surface">
          {screen.title}
        </h1>
        {screen.subtitle && (
          <p className="font-display text-lg text-on-surface/60">{screen.subtitle}</p>
        )}
      </div>

      {/* Progress dots */}
      {transition.screens.length > 1 && (
        <div className="absolute bottom-12 flex gap-2">
          {transition.screens.map((_, i) => (
            <div
              key={`dot-${transition.type}-${i}`}
              className={`h-2 w-2 transition-colors duration-300 ${
                i === currentScreenIndex ? "bg-primary" : "bg-surface-highest"
              }`}
            />
          ))}
        </div>
      )}

      {/* GM skip button */}
      {isHost && (
        <button
          type="button"
          className="absolute bottom-24 font-display uppercase text-sm tracking-wider text-on-surface/40 hover:text-on-surface/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            clearTransition();
          }}
        >
          Pomiń
        </button>
      )}
    </div>
  );
}

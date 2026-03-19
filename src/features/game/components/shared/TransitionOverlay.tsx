"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/features/game/store/gameStore";

export default function TransitionOverlay() {
  const transition = useGameStore((s) => s.transition);
  const clearTransition = useGameStore((s) => s.clearTransition);

  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  const advanceOrClose = useCallback(() => {
    if (!transition) return;

    if (currentScreenIndex < transition.screens.length - 1) {
      // Fade out, then advance to next screen
      setFadeState("out");
      setTimeout(() => {
        setCurrentScreenIndex((i) => i + 1);
        setFadeState("in");
      }, 300);
    } else {
      // Last screen — fade out and close
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

  // Reset state when a new transition starts
  useEffect(() => {
    if (transition) {
      setCurrentScreenIndex(0);
      setFadeState("in");
    }
  }, [transition]);

  if (!transition) return null;

  const screen = transition.screens[currentScreenIndex];
  if (!screen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/95 backdrop-blur-sm"
      onClick={advanceOrClose}
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
        <h1 className="font-typewriter text-3xl font-bold uppercase tracking-widest text-white">
          {screen.title}
        </h1>
        {screen.subtitle && (
          <p className="font-typewriter text-lg text-slate-400">{screen.subtitle}</p>
        )}
      </div>

      {/* Progress dots */}
      {transition.screens.length > 1 && (
        <div className="absolute bottom-12 flex gap-2">
          {transition.screens.map((_, i) => (
            <div
              key={`dot-${transition.type}-${i}`}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                i === currentScreenIndex ? "bg-primary" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/features/game/store/gameStore";
import * as sounds from "@/lib/sounds";

/**
 * Observes game state changes (phase transitions, missions, timer events)
 * and plays corresponding procedural sounds via Web Audio API.
 * Respects soundEnabled / soundVolume from the store.
 */
export function useSoundEffects(): void {
  const phase = useGameStore((s) => s.state?.game?.phase);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const soundVolume = useGameStore((s) => s.soundVolume);
  const transition = useGameStore((s) => s.transition);
  const missionsCount = useGameStore((s) => s.state?.missions?.length ?? 0);
  const gameStatus = useGameStore((s) => s.state?.game?.status);

  const prevPhaseRef = useRef(phase);
  const prevMissionsRef = useRef(missionsCount);
  const prevStatusRef = useRef(gameStatus);
  const initializedRef = useRef(false);

  // Initialize AudioContext on first render (requires prior user interaction)
  useEffect(() => {
    if (!initializedRef.current) {
      const handler = () => {
        sounds.initAudio();
        initializedRef.current = true;
        document.removeEventListener("click", handler);
        document.removeEventListener("touchstart", handler);
      };
      document.addEventListener("click", handler, { once: true });
      document.addEventListener("touchstart", handler, { once: true });
      return () => {
        document.removeEventListener("click", handler);
        document.removeEventListener("touchstart", handler);
      };
    }
  }, []);

  // Phase change sounds
  useEffect(() => {
    if (!soundEnabled || !initializedRef.current) return;
    if (prevPhaseRef.current === phase) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // Skip first load
    if (!prev) return;

    switch (phase) {
      case "night":
        sounds.nightFall(soundVolume);
        break;
      case "day":
        sounds.phaseChange(soundVolume);
        break;
      case "voting":
        sounds.voteReveal(soundVolume);
        break;
      case "review":
      case "ended":
        sounds.gameEnd(soundVolume);
        break;
      default:
        sounds.phaseChange(soundVolume);
    }
  }, [phase, soundEnabled, soundVolume]);

  // New mission sound
  useEffect(() => {
    if (!soundEnabled || !initializedRef.current) return;
    if (prevMissionsRef.current === missionsCount) return;
    const prevCount = prevMissionsRef.current;
    prevMissionsRef.current = missionsCount;
    if (prevCount > 0 && missionsCount > prevCount) {
      sounds.missionReceived(soundVolume);
    }
  }, [missionsCount, soundEnabled, soundVolume]);

  // Game end sound (status change)
  useEffect(() => {
    if (!soundEnabled || !initializedRef.current) return;
    if (prevStatusRef.current === gameStatus) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;
    if (prev === "playing" && gameStatus === "finished") {
      sounds.gameEnd(soundVolume);
    }
  }, [gameStatus, soundEnabled, soundVolume]);

  // Transition overlay elimination sound
  useEffect(() => {
    if (!soundEnabled || !initializedRef.current || !transition) return;
    if (
      transition.type === "voting_to_night" ||
      transition.type === "night_to_day" ||
      transition.type === "voting_ended"
    ) {
      // A slight delay to not overlap with phase change sound
      const timer = setTimeout(() => {
        sounds.elimination(soundVolume);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transition, soundEnabled, soundVolume]);
}

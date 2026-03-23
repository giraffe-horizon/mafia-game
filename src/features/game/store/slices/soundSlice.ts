import type { StateCreator } from "zustand";
import type { GameState } from "@/features/game/store/gameStore";

const SOUND_ENABLED_KEY = "mafia-sound-enabled";
const SOUND_VOLUME_KEY = "mafia-sound-volume";

function loadBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  } catch {
    return fallback;
  }
}

function loadNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export interface SoundSlice {
  soundEnabled: boolean;
  soundVolume: number;

  toggleSound: () => void;
  setVolume: (v: number) => void;
}

export const createSoundSlice: StateCreator<GameState, [], [], SoundSlice> = (set, get) => ({
  soundEnabled: loadBoolean(SOUND_ENABLED_KEY, true),
  soundVolume: loadNumber(SOUND_VOLUME_KEY, 0.5),

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, String(next));
    } catch {
      // localStorage unavailable
    }
  },

  setVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ soundVolume: clamped });
    try {
      localStorage.setItem(SOUND_VOLUME_KEY, String(clamped));
    } catch {
      // localStorage unavailable
    }
  },
});

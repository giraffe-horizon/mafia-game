"use client";

// ---------------------------------------------------------------------------
// Procedural sound effects via Web Audio API — zero audio files
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Ensure AudioContext is resumed — call on first user interaction */
export function initAudio(): void {
  getContext();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playFreqRamp(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// ---------------------------------------------------------------------------
// Sound definitions
// ---------------------------------------------------------------------------

/** Short military beep — 2 rising tones, 200ms total */
export function phaseChange(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 660, t, 0.1, volume * 0.6, "square");
  playTone(ctx, 880, t + 0.1, 0.1, volume * 0.6, "square");
}

/** Dramatic reveal — low tone rising to high, 400ms */
export function voteReveal(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playFreqRamp(ctx, 220, 660, t, 0.4, volume * 0.5, "sawtooth");
}

/** Dark elimination tone — low, falling, 300ms */
export function elimination(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playFreqRamp(ctx, 330, 110, t, 0.3, volume * 0.5, "sawtooth");
}

/** Alert chirp — 3 fast tones, 150ms total */
export function missionReceived(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 1200, t, 0.04, volume * 0.4, "sine");
  playTone(ctx, 1400, t + 0.05, 0.04, volume * 0.4, "sine");
  playTone(ctx, 1600, t + 0.1, 0.05, volume * 0.4, "sine");
}

/** Ticking click — single short click */
export function timerWarning(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 800, t, 0.03, volume * 0.3, "square");
}

/** Alarm buzzer — harsh 500ms */
export function timerExpired(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 440, t, 0.15, volume * 0.6, "sawtooth");
  playTone(ctx, 330, t + 0.15, 0.15, volume * 0.6, "sawtooth");
  playTone(ctx, 440, t + 0.3, 0.2, volume * 0.6, "sawtooth");
}

/** Fanfare / siren — 800ms */
export function gameEnd(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playFreqRamp(ctx, 440, 880, t, 0.4, volume * 0.5, "square");
  playFreqRamp(ctx, 880, 440, t + 0.4, 0.4, volume * 0.5, "square");
}

/** Eerie ambient tone — low, quiet, 600ms */
export function nightFall(volume = 0.5): void {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playFreqRamp(ctx, 150, 110, t, 0.6, volume * 0.25, "sine");
  playTone(ctx, 165, t, 0.6, volume * 0.15, "triangle");
}

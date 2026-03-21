"use client";

import { useEffect, useState } from "react";
import { Stamp } from "@/components/ui";

const NIGHT_MESSAGES = [
  "Noc zapada nad miastem...",
  "Słyszysz kroki w ciemności...",
  "Czekasz na świt...",
  "Cienie tańczą za oknem...",
  "Ciemność skrywa wiele tajemnic...",
  "Cisza nocna wypełnia ulice...",
  "Miasto śpi niespokojnym snem...",
  "Wiatr szumi między budynkami...",
];

interface CivilianNightViewProps {
  round: number;
}

export default function CivilianNightView({ round }: CivilianNightViewProps) {
  const [progress, setProgress] = useState(0);

  // Pick message based on round number for consistency
  const messageIndex = (round - 1) % NIGHT_MESSAGES.length;
  const message = NIGHT_MESSAGES[messageIndex];

  // Animate progress bar (fake progress)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Stop at 95% to indicate waiting
        return prev + Math.random() * 3 + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-4 mt-4 border border-surface-highest bg-surface-highest/5">
      {/* Header */}
      <div className="border-b border-surface-highest px-3 py-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px] text-on-surface/60 animate-pulse">
          bedtime
        </span>
        <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
          Obserwacja Nocna
        </span>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col items-center gap-6">
        {/* Large animated icon */}
        <div className="relative">
          <span className="material-symbols-outlined text-[60px] text-on-surface/40 animate-pulse">
            bedtime
          </span>
          <div className="absolute inset-0 animate-ping opacity-20">
            <span className="material-symbols-outlined text-[60px] text-on-surface/40">
              bedtime
            </span>
          </div>
        </div>

        {/* Atmospheric message */}
        <p className="font-display text-sm text-on-surface/70 text-center leading-relaxed max-w-xs">
          {message}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="font-display text-[10px] uppercase tracking-widest text-on-surface/40">
              Do świtu
            </span>
            <span className="font-display text-[10px] uppercase tracking-widest text-on-surface/40">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1 bg-surface-highest/40">
            <div
              className="h-full bg-on-surface/30 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
        </div>

        {/* Role stamp */}
        <div className="mt-4">
          <Stamp color="default" rotate={-1}>
            CYWIL — OBSERWACJA
          </Stamp>
        </div>

        {/* Instructions */}
        <p className="font-display text-[10px] text-on-surface/40 text-center uppercase tracking-widest mt-2">
          Obserwujesz z ukrycia. Czekaj na rozkazy.
        </p>
      </div>
    </div>
  );
}

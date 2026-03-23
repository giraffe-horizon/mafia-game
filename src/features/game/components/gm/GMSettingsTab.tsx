"use client";

import type { PublicPlayer } from "@/db";
import { SectionHeader } from "@/components/ui";
import { autoMafiaCount } from "@/lib/constants";
import { useGameStore } from "@/features/game/store/gameStore";

const TIMER_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1min", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "2min", seconds: 120 },
  { label: "5min", seconds: 300 },
];

interface GMSettingsTabProps {
  players: PublicPlayer[];
  mafiaCountSetting: number;
  onMafiaCountSettingChange: (n: number) => void;
}

export default function GMSettingsTab({
  players,
  mafiaCountSetting,
  onMafiaCountSettingChange,
}: GMSettingsTabProps) {
  const setPhaseTimer = useGameStore((s) => s.setPhaseTimer);
  const clearPhaseTimer = useGameStore((s) => s.clearPhaseTimer);
  const phaseDeadline = useGameStore((s) => s.phaseDeadline);

  return (
    <div className="space-y-6">
      {/* Mafia count section */}
      <div>
        <SectionHeader className="mb-1">Liczba mafii — następna runda</SectionHeader>
        <p className="text-on-surface-dim text-xs mb-3">
          Ta wartość zostanie użyta przy kolejnym remacie.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onMafiaCountSettingChange(0)}
            className={`px-3 py-2 text-sm font-display uppercase tracking-wider border transition-all ${
              mafiaCountSetting === 0
                ? "bg-primary/20 border-primary/50 text-primary"
                : "border-surface-highest text-on-surface-dim hover:border-on-surface-dim"
            }`}
          >
            Auto ({autoMafiaCount(players.length)})
          </button>
          {Array.from({ length: Math.max(1, players.length - 3) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onMafiaCountSettingChange(n)}
              className={`w-10 h-10 text-sm font-bold font-display border transition-all ${
                mafiaCountSetting === n
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "border-surface-highest text-on-surface-dim hover:border-on-surface-dim"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-on-surface-dim text-xs mt-2">reszta cywile</p>
      </div>

      {/* Timer section */}
      <div>
        <SectionHeader icon="timer" className="mb-1">
          Timer fazy
        </SectionHeader>
        <p className="text-on-surface-dim text-xs mb-3">Ustaw countdown dla bieżącej fazy.</p>
        <div className="flex items-center gap-2 flex-wrap">
          {TIMER_PRESETS.map((preset) => (
            <button
              key={preset.seconds}
              onClick={() => setPhaseTimer(preset.seconds)}
              className="px-3 py-2 text-sm font-display uppercase tracking-wider border border-surface-highest text-on-surface-dim hover:border-on-surface-dim transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
        {phaseDeadline && (
          <button
            onClick={() => clearPhaseTimer()}
            className="mt-3 px-4 py-2 text-sm font-display uppercase tracking-wider border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined text-[14px] align-middle mr-1">
              stop_circle
            </span>
            Stop timer
          </button>
        )}
      </div>
    </div>
  );
}

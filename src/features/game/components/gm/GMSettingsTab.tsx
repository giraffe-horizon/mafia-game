"use client";

import type { PublicPlayer } from "@/db";
import { SectionHeader } from "@/components/ui";
import { autoMafiaCount } from "@/lib/constants";

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
  return (
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
  );
}

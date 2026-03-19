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
      <p className="text-slate-600 text-xs mb-3">
        Ta wartość zostanie użyta przy kolejnym remacie.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onMafiaCountSettingChange(0)}
          className={`px-3 py-2 rounded-lg text-sm font-typewriter uppercase tracking-wider border transition-all ${
            mafiaCountSetting === 0
              ? "bg-primary/20 border-primary/50 text-primary"
              : "border-slate-700 text-slate-400 hover:border-slate-500"
          }`}
        >
          Auto ({autoMafiaCount(players.length)})
        </button>
        {Array.from({ length: Math.max(1, players.length - 3) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onMafiaCountSettingChange(n)}
            className={`w-10 h-10 rounded-lg text-sm font-bold font-typewriter border transition-all ${
              mafiaCountSetting === n
                ? "bg-primary/20 border-primary/50 text-primary"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-slate-600 text-xs mt-2">reszta cywile</p>
    </div>
  );
}

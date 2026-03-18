"use client";

import { useState } from "react";
import type { PublicPlayer } from "@/lib/db";

interface GMSettingsTabProps {
  players: PublicPlayer[];
  mafiaCountSetting: number;
  onMafiaCountSettingChange: (n: number) => void;
  onTransferGm: (playerId: string) => void;
}

export default function GMSettingsTab({
  players,
  mafiaCountSetting,
  onMafiaCountSettingChange,
  onTransferGm,
}: GMSettingsTabProps) {
  const [transferGmTarget, setTransferGmTarget] = useState("");
  const [transferGmPending, setTransferGmPending] = useState(false);
  const [transferGmError, setTransferGmError] = useState("");

  async function handleTransferGm() {
    if (!transferGmTarget) return;
    setTransferGmPending(true);
    setTransferGmError("");
    try {
      onTransferGm(transferGmTarget);
      setTransferGmTarget("");
    } catch {
      setTransferGmError("Błąd przekazania MG");
    } finally {
      setTransferGmPending(false);
    }
  }

  return (
    <div>
      <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-1">
        Liczba mafii — następna runda
      </p>
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
          Auto ({players.length <= 5 ? 1 : players.length <= 8 ? 2 : players.length <= 11 ? 3 : 4})
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

      {/* GM Transfer Section */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-3">
          Przekaż rolę MG
        </p>
        {transferGmError && (
          <p className="text-red-400 text-xs font-typewriter mb-2">{transferGmError}</p>
        )}
        <div className="flex gap-3">
          <select
            value={transferGmTarget}
            onChange={(e) => setTransferGmTarget(e.target.value)}
            className="flex-1 h-10 rounded-lg bg-black/40 border border-slate-700 text-white text-sm px-3 font-typewriter"
          >
            <option value="">— Wybierz gracza —</option>
            {players
              .filter((p) => !p.isHost && p.isAlive)
              .map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {p.nickname}
                </option>
              ))}
          </select>
          <button
            onClick={handleTransferGm}
            disabled={!transferGmTarget || transferGmPending}
            className="px-4 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-typewriter uppercase tracking-wider text-sm transition-all disabled:opacity-40"
          >
            {transferGmPending ? "Przekazuję..." : "Przekaż"}
          </button>
        </div>
      </div>
    </div>
  );
}

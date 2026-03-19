"use client";

import { useState } from "react";
import type { PublicPlayer } from "@/db";

interface GMSettingsTabProps {
  players: PublicPlayer[];
  mafiaCountSetting: number;
  onMafiaCountSettingChange: (n: number) => void;
  onTransferGm: (playerId: string) => Promise<unknown> | void;
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
      await onTransferGm(transferGmTarget);
      setTransferGmTarget("");
    } catch {
      setTransferGmError("Błąd przekazania MG");
    } finally {
      setTransferGmPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mafia count — dossier card */}
      <div className="border border-on-surface/12 bg-surface-low">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-on-surface/8">
          <span className="material-symbols-outlined text-[14px] text-on-surface/30">group</span>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
            Skład mafii — następna runda
          </p>
        </div>
        <div className="px-3 py-3">
          <p className="text-on-surface/30 text-xs font-display mb-3">
            Używane przy kolejnym remachu.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onMafiaCountSettingChange(0)}
              className={`px-3 py-2 text-sm font-display uppercase tracking-wider border ${
                mafiaCountSetting === 0
                  ? "border-stamp bg-stamp/10 text-stamp"
                  : "border-on-surface/20 text-on-surface/40 hover:border-on-surface/40"
              }`}
            >
              Auto (
              {players.length <= 5 ? 1 : players.length <= 8 ? 2 : players.length <= 11 ? 3 : 4})
            </button>
            {Array.from({ length: Math.max(1, players.length - 3) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onMafiaCountSettingChange(n)}
                className={`w-10 h-10 text-sm font-bold font-display border ${
                  mafiaCountSetting === n
                    ? "border-stamp bg-stamp/10 text-stamp"
                    : "border-on-surface/20 text-on-surface/40 hover:border-on-surface/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-on-surface/25 text-[10px] mt-2 font-display">reszta cywile</p>
        </div>
      </div>

      {/* Authority transfer — dossier card */}
      <div className="border border-on-surface/12 bg-surface-low">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-on-surface/8">
          <span className="material-symbols-outlined text-[14px] text-on-surface/30">
            transfer_within_a_station
          </span>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
            Przekazanie autorytetu MG
          </p>
        </div>
        <div className="px-3 py-3">
          {transferGmError && (
            <p className="text-stamp text-xs font-display mb-2">{transferGmError}</p>
          )}
          <div className="flex gap-2">
            <select
              value={transferGmTarget}
              onChange={(e) => setTransferGmTarget(e.target.value)}
              className="flex-1 h-10 bg-background border border-on-surface/20 text-on-surface text-sm px-3 font-display focus:outline-none focus:border-stamp"
            >
              <option value="">— Wybierz agenta —</option>
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
              className="px-4 h-10 bg-stamp text-on-paper border border-stamp font-display font-bold uppercase tracking-widest text-xs hover:bg-stamp/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {transferGmPending ? "..." : "Przekaż"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

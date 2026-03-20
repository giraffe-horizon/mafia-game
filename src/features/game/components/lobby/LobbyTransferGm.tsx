"use client";

import { useState } from "react";
import type { PublicPlayer } from "@/db";

interface LobbyTransferGmProps {
  players: PublicPlayer[];
  onTransfer: (playerId: string) => void;
}

export default function LobbyTransferGm({ players, onTransfer }: LobbyTransferGmProps) {
  const [open, setOpen] = useState(false);
  if (players.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 h-10 border border-stamp/30 text-stamp/60 hover:text-stamp hover:border-stamp/50 font-display uppercase tracking-wider text-xs transition-all bg-stamp/5"
      >
        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
        Lista agentów
      </button>
      {open && (
        <div className="mt-2 paper-card p-3">
          <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-paper/50 mb-2">
            PERSONEL OPERACYJNY — PRZEKAŻ DOWODZENIE
          </p>
          {players.map((p) => (
            <button
              key={p.playerId}
              onClick={() => {
                onTransfer(p.playerId);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-2 py-2 border-b border-on-paper/10 last:border-b-0 hover:bg-stamp/10 transition-colors text-left"
            >
              <span className="font-display text-[10px] text-on-paper/60 w-4">#</span>
              <span className="text-on-paper text-sm font-display">{p.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

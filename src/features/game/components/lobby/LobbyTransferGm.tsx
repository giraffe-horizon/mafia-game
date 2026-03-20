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
        className="w-full flex items-center justify-center gap-2 h-10 border border-surface-highest text-on-surface/40 hover:text-on-surface/70 hover:border-on-surface/40 font-display uppercase tracking-wider text-xs transition-all"
      >
        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
        Przekaż rolę MG
      </button>
      {open && (
        <div className="mt-2 border border-surface-highest bg-surface-low overflow-hidden">
          {players.map((p) => (
            <button
              key={p.playerId}
              onClick={() => {
                onTransfer(p.playerId);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-surface-highest last:border-b-0 hover:bg-primary/5 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface/40">
                person
              </span>
              <span className="text-on-surface text-sm font-display">{p.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

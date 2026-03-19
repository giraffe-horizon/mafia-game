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
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 font-typewriter uppercase tracking-wider text-xs transition-all"
      >
        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
        Przekaż rolę MG
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-slate-700 bg-black/30 overflow-hidden">
          {players.map((p) => (
            <button
              key={p.playerId}
              onClick={() => {
                onTransfer(p.playerId);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-800 last:border-b-0 hover:bg-primary/5 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500">person</span>
              <span className="text-white text-sm">{p.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

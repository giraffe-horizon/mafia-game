import { ROLE_LABELS } from "@/lib/constants";
import type { PublicPlayer } from "@/db/types";
import { Badge, Stamp } from "@/components/ui";

interface DeadSpectatorViewProps {
  currentPlayer: { role?: string };
  players: PublicPlayer[];
}

export default function DeadSpectatorView({ currentPlayer, players }: DeadSpectatorViewProps) {
  return (
    <div className="mx-4 mt-4 flex flex-col gap-4">
      {/* NIE ŻYJESZ stamp card */}
      <div className="border border-primary-dark/30 bg-red-950/10 p-6 flex flex-col items-center gap-3 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Stamp variant="classified" rotate={-2} className="text-sm px-3 py-1">
            NIE ŻYJESZ
          </Stamp>
        </div>
        <span className="material-symbols-outlined text-[48px] text-primary-dark/40 mt-2">
          skull
        </span>
        <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest text-center">
          Obserwujesz grę jako widz
        </p>
        {currentPlayer.role && (
          <p className="font-display text-on-surface/40 text-xs uppercase tracking-widest">
            Byłeś:{" "}
            <span className="text-on-surface font-black">
              {ROLE_LABELS[currentPlayer.role] ?? currentPlayer.role}
            </span>
          </p>
        )}
      </div>

      {/* Player roles list */}
      <div className="border border-surface-highest">
        <div className="border-b border-surface-highest px-3 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface/40">
            visibility
          </span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/40">
            Role graczy
          </span>
        </div>
        <div className="flex flex-col">
          {players
            .filter((p) => !p.isHost)
            .map((p, i) => (
              <div
                key={p.playerId}
                className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-surface-highest/40" : ""} ${!p.isAlive ? "opacity-40" : ""}`}
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface/50">
                  {p.isAlive ? "person" : "skull"}
                </span>
                <span
                  className={`font-display text-sm uppercase tracking-wide flex-1 ${!p.isAlive ? "line-through text-on-surface/40" : "text-on-surface"}`}
                >
                  {p.nickname}
                </span>
                {p.role && (
                  <Badge variant={p.role as "mafia" | "detective" | "doctor" | "civilian"}>
                    {ROLE_LABELS[p.role] ?? p.role}
                  </Badge>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

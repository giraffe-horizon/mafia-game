import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import type { PublicPlayer } from "@/db/types";
import { Badge } from "@/components/ui";

interface DeadSpectatorViewProps {
  currentPlayer: { role?: string };
  players: PublicPlayer[];
}

export default function DeadSpectatorView({ currentPlayer, players }: DeadSpectatorViewProps) {
  return (
    <div className="mx-5 mt-5">
      {/* NIE ŻYJESZ dossier card */}
      <div className="border border-on-surface/12 bg-surface-low p-5 text-center mb-4 relative">
        {/* Tape corner decoration */}
        <div
          className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-12 h-3"
          style={{
            background: "rgba(215,195,176,0.35)",
            transform: "translateX(-50%) rotate(-0.5deg)",
          }}
        />
        <span className="material-symbols-outlined text-[40px] text-on-surface/20 mb-3 block">
          skull
        </span>
        <div className="flex justify-center mb-2">
          <span
            className="stamp stamp-red text-[11px] px-3 py-1"
            style={{ transform: "rotate(-3deg)" }}
          >
            NIE ŻYJESZ
          </span>
        </div>
        <p className="text-on-surface/30 text-xs font-display mt-3 uppercase tracking-widest">
          Obserwujesz grę jako widz
        </p>
        <p className="text-on-surface/20 text-[10px] font-display mt-1">
          Nie zdradzaj informacji żywym graczom!
        </p>
        {currentPlayer.role && (
          <p className="text-on-surface/35 text-[10px] font-display mt-3">
            Byłeś:{" "}
            <span
              className={`font-bold ${ROLE_COLORS[currentPlayer.role] ?? "text-on-surface/60"}`}
            >
              {ROLE_LABELS[currentPlayer.role] ?? currentPlayer.role}
            </span>
          </p>
        )}
      </div>

      {/* Revealed roles — dossier entries */}
      <div className="border border-on-surface/12 bg-surface-low">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-on-surface/8">
          <span className="material-symbols-outlined text-[14px] text-on-surface/30">
            visibility
          </span>
          <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/30">
            Widok widza — tożsamości
          </p>
        </div>
        <div className="flex flex-col">
          {players
            .filter((p) => !p.isHost)
            .map((p) => (
              <div
                key={p.playerId}
                className={`flex items-center gap-3 px-4 py-3 border-b border-on-surface/6 last:border-0 ${
                  !p.isAlive ? "opacity-40" : ""
                }`}
              >
                {/* Status dot */}
                <div
                  className={`w-2 h-2 border shrink-0 ${
                    p.isAlive
                      ? "border-on-surface/30 bg-on-surface/20"
                      : "border-on-surface/15 bg-transparent"
                  }`}
                />
                {/* Role icon */}
                {p.role && (
                  <span
                    className={`material-symbols-outlined text-[16px] shrink-0 ${
                      ROLE_COLORS[p.role] ?? "text-on-surface/30"
                    }`}
                  >
                    {ROLE_ICONS[p.role] ?? "person"}
                  </span>
                )}
                {/* Nickname */}
                <span
                  className={`font-display text-sm flex-1 ${
                    p.isAlive ? "text-on-surface" : "text-on-surface/30 line-through"
                  }`}
                >
                  {p.nickname}
                </span>
                {/* Role badge */}
                {p.role ? (
                  <Badge variant={p.role as "mafia" | "detective" | "doctor" | "civilian"}>
                    {ROLE_LABELS[p.role] ?? p.role}
                  </Badge>
                ) : (
                  <span className="text-on-surface/20 text-[10px] font-display uppercase">?</span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

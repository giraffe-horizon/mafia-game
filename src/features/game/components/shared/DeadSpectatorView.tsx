import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/constants";
import type { PublicPlayer } from "@/db/types";
import { Stamp } from "@/components/ui";

interface DeadSpectatorViewProps {
  currentPlayer: { role?: string };
  players: PublicPlayer[];
  phase?: string;
  round?: number;
}

export default function DeadSpectatorView({
  currentPlayer,
  players,
  phase = "unknown",
  round = 1,
}: DeadSpectatorViewProps) {
  const nonHostPlayers = players.filter((p) => !p.isHost);

  // Statistics for the post-mortem report
  const alivePlayers = nonHostPlayers.filter((p) => p.isAlive);
  const aliveMafia = alivePlayers.filter((p) => p.role === "mafia").length;
  const aliveCivilians = alivePlayers.filter((p) => p.role !== "mafia").length;
  const totalAlive = alivePlayers.length;

  // Phase translation
  const phaseLabels: Record<string, string> = {
    lobby: "Lobby",
    night: "Noc",
    day: "Dzień",
    voting: "Głosowanie",
    review: "Przegląd",
    ended: "Koniec",
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* WYELIMINOWANY header */}
      <div
        className="p-5 flex flex-col items-center gap-2 relative"
        style={{
          background: "linear-gradient(180deg, rgba(80,20,20,0.3) 0%, transparent 100%)",
        }}
      >
        <Stamp variant="classified" rotate={-2} className="text-base px-4 py-1.5">
          WYELIMINOWANY
        </Stamp>
        <span className="material-symbols-outlined text-[36px] text-primary-dark/50">skull</span>
        <p className="font-display text-on-surface/50 text-xs uppercase tracking-widest text-center">
          Obserwujesz grę z zaświatów...
        </p>
        {currentPlayer.role && (
          <p className="font-display text-on-surface/50 text-xs uppercase tracking-widest">
            Byłeś:{" "}
            <span className="text-on-surface font-black">
              {ROLE_LABELS[currentPlayer.role] ?? currentPlayer.role}
            </span>
          </p>
        )}
      </div>

      {/* RAPORT POŚMIERTNY */}
      <div className="mx-4 mb-4 border border-surface-highest bg-surface-highest/10">
        <div className="border-b border-surface-highest px-3 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface/60">
            assessment
          </span>
          <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface/60">
            Raport pośmiertny
          </span>
        </div>
        <div className="p-3 space-y-3">
          {/* Current phase */}
          <div className="flex justify-between items-center">
            <span className="font-display text-xs uppercase tracking-widest text-on-surface/50">
              Aktualna faza:
            </span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface">
              {phaseLabels[phase] || phase} • Runda {round}
            </span>
          </div>

          {/* Game statistics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-display text-xs uppercase tracking-widest text-on-surface/50">
                Żywi agenci:
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-on-surface">
                {totalAlive} osób
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-display text-xs uppercase tracking-widest text-red-400">
                Mafia:
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-red-400">
                {aliveMafia}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-display text-xs uppercase tracking-widest text-blue-400">
                Cywile + specjaliści:
              </span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-blue-400">
                {aliveCivilians}
              </span>
            </div>

            {/* Power balance */}
            <div className="pt-1 border-t border-surface-highest/30">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs uppercase tracking-widest text-on-surface/50">
                  Stosunek sił:
                </span>
                <span
                  className={`font-display font-black text-xs uppercase tracking-widest ${
                    aliveMafia >= aliveCivilians
                      ? "text-red-400"
                      : aliveMafia === 0
                        ? "text-green-400"
                        : "text-on-surface"
                  }`}
                >
                  {aliveMafia >= aliveCivilians
                    ? "PRZEWAGA MAFII"
                    : aliveMafia === 0
                      ? "MAFIA WYELIMINOWANA"
                      : "PRZEWAGA CYWILI"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player roles list — full dossier */}
      <div className="flex-1 border-t border-surface-highest">
        <div className="px-4 py-2 flex items-center gap-2 border-b border-surface-highest/40">
          <span className="material-symbols-outlined text-[14px] text-on-surface/50">
            visibility
          </span>
          <span className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/50">
            TECZKI AGENTÓW — ODTAJNIONE
          </span>
        </div>
        <div className="flex flex-col">
          {nonHostPlayers.map((p, i) => (
            <div
              key={p.playerId}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-surface-highest/30" : ""}`}
              style={!p.isAlive ? { opacity: 0.5 } : undefined}
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface/50">
                {p.isAlive ? "person" : "skull"}
              </span>
              <span
                className={`font-display font-bold text-sm uppercase tracking-wide flex-1 ${!p.isAlive ? "line-through text-on-surface/40" : "text-on-surface"}`}
              >
                {p.nickname}
              </span>
              {p.role ? (
                <span
                  className={`font-display font-black text-[10px] uppercase tracking-widest px-2 py-1 border ${ROLE_BADGE_COLORS[p.role] ?? ROLE_BADGE_COLORS.civilian}`}
                >
                  {ROLE_LABELS[p.role] ?? p.role}
                </span>
              ) : (
                <span className="font-display text-[10px] uppercase tracking-widest text-on-surface/30 px-2 py-1 border border-dashed border-on-surface/15">
                  ???
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

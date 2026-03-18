import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants";
import type { PublicPlayer } from "@/db/types";
import { Card, Badge, SectionHeader, StatusItem } from "@/components/ui";

interface DeadSpectatorViewProps {
  currentPlayer: { role?: string };
  players: PublicPlayer[];
}

export default function DeadSpectatorView({ currentPlayer, players }: DeadSpectatorViewProps) {
  return (
    <div className="mx-5 mt-5">
      <Card className="p-5 text-center mb-4">
        <span className="material-symbols-outlined text-[48px] text-slate-600 mb-2 block">
          skull
        </span>
        <p className="font-typewriter text-slate-400 text-lg uppercase tracking-widest">
          Nie żyjesz
        </p>
        <p className="text-slate-600 text-xs mt-2">
          Obserwujesz grę jako widz. Nie zdradzaj informacji żywym graczom!
        </p>
        {currentPlayer.role && (
          <p className="text-slate-500 text-xs mt-3 font-typewriter">
            Byłeś:{" "}
            <span className={`font-bold ${ROLE_COLORS[currentPlayer.role] ?? "text-slate-300"}`}>
              {ROLE_LABELS[currentPlayer.role] ?? currentPlayer.role}
            </span>
          </p>
        )}
      </Card>
      <SectionHeader icon="visibility" className="pl-1">
        Widok widza — role graczy
      </SectionHeader>
      <div className="flex flex-col gap-2">
        {players
          .filter((p) => !p.isHost)
          .map((p) => (
            <StatusItem
              key={p.playerId}
              className={!p.isAlive ? "opacity-50" : ""}
              icon={
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${p.isAlive ? "border-slate-700 bg-slate-800" : "border-slate-800 bg-slate-900"}`}
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">
                    {p.isAlive ? "person" : "skull"}
                  </span>
                </div>
              }
              label={p.nickname}
              labelClassName={p.isAlive ? "text-white" : "text-slate-600 line-through"}
              trailing={
                p.role ? (
                  <Badge variant={p.role as "mafia" | "detective" | "doctor" | "civilian"}>
                    {ROLE_LABELS[p.role] ?? p.role}
                  </Badge>
                ) : undefined
              }
            />
          ))}
      </div>
    </div>
  );
}

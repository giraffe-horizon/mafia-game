"use client";

import { useState } from "react";
import { ROLE_LABELS, ROLE_ICONS, ROLE_COLORS } from "@/lib/constants";
import { SectionHeader, StatusItem, Badge, Button } from "@/components/ui";
import { useGameStore } from "../_stores/gameStore";

export default function EndScreen(_props: Record<string, never> = {}) {
  // Get data from store
  const state = useGameStore((s) => s.state);
  const rematchGame = useGameStore((s) => s.rematchGame);
  const [rematchPending, setRematchPending] = useState(false);
  const [mafiaCountSetting] = useState(0); // This would be passed from parent or managed in store

  if (!state) return null;

  const { game, players, currentPlayer, hostMissions } = state;
  const isHost = currentPlayer.isHost;

  const handleRematch = async () => {
    setRematchPending(true);
    try {
      await rematchGame(mafiaCountSetting);
    } finally {
      setRematchPending(false);
    }
  };
  const winnerLabel = game.winner === "mafia" ? "Mafia wygrała!" : "Miasto wygrało!";
  const winnerIcon = game.winner === "mafia" ? "masks" : "groups";
  const winnerColor = game.winner === "mafia" ? "text-red-500" : "text-green-400";

  const isWinner =
    (game.winner === "mafia" && currentPlayer.role === "mafia") ||
    (game.winner === "town" && currentPlayer.role !== "mafia");

  const missionSummary =
    hostMissions && hostMissions.length > 0
      ? Object.values(
          hostMissions.reduce<
            Record<string, { nickname: string; completed: number; total: number; points: number }>
          >((acc, m) => {
            if (!acc[m.playerId])
              acc[m.playerId] = { nickname: m.playerNickname, completed: 0, total: 0, points: 0 };
            acc[m.playerId].total++;
            if (m.isCompleted) {
              acc[m.playerId].completed++;
              acc[m.playerId].points += m.points;
            }
            return acc;
          }, {})
        )
      : [];

  return (
    <div className="mx-5 mt-5">
      <div className="p-6 rounded-xl bg-black/60 border border-primary/20 text-center">
        <span className={`material-symbols-outlined text-[56px] ${winnerColor} mb-3 block`}>
          {winnerIcon}
        </span>
        <p
          className={`font-typewriter text-2xl font-bold uppercase tracking-widest ${winnerColor} mb-2`}
        >
          {winnerLabel}
        </p>
        {!isHost && (
          <p
            className={`font-typewriter text-sm uppercase tracking-wider ${isWinner ? "text-green-400" : "text-slate-500"}`}
          >
            {isWinner ? "Wygrałeś!" : "Przegrałeś"}
          </p>
        )}
        {isHost && (
          <div className="mt-4 flex flex-col gap-2">
            {mafiaCountSetting !== undefined && mafiaCountSetting > 0 && (
              <p className="text-slate-600 text-xs font-typewriter text-center">
                Następna runda: {mafiaCountSetting}{" "}
                {mafiaCountSetting === 1 ? "mafioz" : "mafiozy/ów"}
              </p>
            )}
            <Button
              onClick={handleRematch}
              disabled={rematchPending}
              loading={rematchPending}
              icon="replay"
              className="mx-auto"
            >
              {rematchPending ? "Resetuję..." : "NASTĘPNA RUNDA"}
            </Button>
          </div>
        )}
      </div>

      {isHost && missionSummary.length > 0 && (
        <div className="mt-5">
          <SectionHeader className="mb-3 pl-1">Podsumowanie misji</SectionHeader>
          <div className="flex flex-col gap-2">
            {missionSummary.map((s) => (
              <StatusItem
                key={s.nickname}
                icon={
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    person
                  </span>
                }
                label={s.nickname}
                labelClassName="text-white"
                trailing={
                  <>
                    <span className="text-slate-400 text-xs font-typewriter">
                      {s.completed}/{s.total} misji
                    </span>
                    {s.points > 0 && (
                      <span className="text-yellow-400 text-xs font-typewriter font-bold">
                        +{s.points}pkt
                      </span>
                    )}
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      <SectionHeader className="mt-5 mb-3 pl-1">Role graczy</SectionHeader>
      <div className="flex flex-col gap-2">
        {players
          .filter((p) => !p.isHost)
          .map((p) => (
            <StatusItem
              key={p.playerId}
              className={
                p.isAlive
                  ? "border-slate-700 bg-black/20"
                  : "border-slate-800 bg-black/10 opacity-50"
              }
              icon={
                <span
                  className={`material-symbols-outlined text-[22px] ${p.role ? ROLE_COLORS[p.role] : "text-slate-500"}`}
                >
                  {p.role ? ROLE_ICONS[p.role] : "person"}
                </span>
              }
              label={p.nickname}
              labelClassName="text-white"
              trailing={
                p.role ? (
                  <Badge
                    variant={p.role as "mafia" | "detective" | "doctor" | "civilian"}
                    className="py-0.5"
                  >
                    {ROLE_LABELS[p.role]}
                  </Badge>
                ) : undefined
              }
            />
          ))}
      </div>
    </div>
  );
}

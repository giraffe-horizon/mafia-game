"use client";

import { useGameStore } from "../_stores/gameStore";
import { SectionHeader } from "@/components/ui";

interface LogsTabProps {
  token: string;
}

export default function LogsTab({ token }: LogsTabProps) {
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const { game, currentPlayer, messages, missions, gameLog } = state;
  const isLobby = game.status === "lobby";

  // Lobby: game info
  if (isLobby) {
    return (
      <div className="mx-5 mt-5">
        <SectionHeader className="mb-3 pl-1">Informacje o sesji</SectionHeader>
        <div className="border border-on-surface/10 bg-surface-low p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-on-surface/35 font-display uppercase tracking-widest text-[10px]">
              Kod sesji
            </span>
            <span className="font-display font-bold text-on-surface tracking-widest">
              {game.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface/35 font-display uppercase tracking-widest text-[10px]">
              Runda
            </span>
            <span className="font-display font-bold text-on-surface">{game.round}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface/35 font-display uppercase tracking-widest text-[10px]">
              Status
            </span>
            <span className="font-display font-bold text-on-surface uppercase tracking-wider text-xs">
              Lobby
            </span>
          </div>
          <div className="pt-2 border-t border-on-surface/8">
            <p className="text-on-surface/25 text-[10px] font-display break-all">Token: {token}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 mx-5 mt-5">
      {/* GM Messages */}
      {messages.length > 0 && (
        <div>
          <SectionHeader icon="mail" className="mb-3 pl-1">
            Wiadomości od MG
          </SectionHeader>
          <div className="flex flex-col gap-2">
            {[...messages].reverse().map((msg) => (
              <div key={msg.id} className="border border-stamp/30 bg-stamp/5 p-3">
                <p className="text-on-surface text-sm font-display leading-relaxed">
                  {msg.content}
                </p>
                <p className="text-on-surface/30 text-[10px] font-display mt-1 uppercase tracking-wider">
                  {new Date(msg.createdAt).toLocaleTimeString("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player missions (non-host) */}
      {!currentPlayer.isHost && missions.length > 0 && state.showPoints && (
        <div>
          <SectionHeader icon="task" className="mb-3 pl-1">
            Twoje misje
          </SectionHeader>
          <div className="flex flex-col gap-2">
            {missions.map((m) => (
              <div
                key={m.id}
                className={`p-3 border ${m.isCompleted ? "border-green-700/30 bg-green-950/10 opacity-80" : "border-on-surface/15 bg-surface-low"}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${m.isCompleted ? "text-green-400" : "text-stamp"}`}
                  >
                    {m.isCompleted ? "check_circle" : "task"}
                  </span>
                  <p
                    className={`text-sm flex-1 font-display ${m.isCompleted ? "text-on-surface/50 line-through" : "text-on-surface"}`}
                  >
                    {m.description}
                  </p>
                  {m.points > 0 && (
                    <span
                      className={`text-xs font-display font-bold shrink-0 ${m.isCompleted ? "text-green-400" : "text-stamp"}`}
                    >
                      +{m.points}pkt
                    </span>
                  )}
                </div>
                <p
                  className={`text-[10px] font-display uppercase tracking-wider mt-1.5 ml-6 ${m.isCompleted ? "text-green-500/60" : "text-on-surface/25"}`}
                >
                  {m.isCompleted ? "WYKONANO" : "W TOKU"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game log events */}
      {gameLog && gameLog.length > 0 && (
        <div>
          <SectionHeader icon="history" className="mb-3 pl-1">
            Dziennik zdarzeń
          </SectionHeader>
          <div className="flex flex-col gap-3">
            {[...gameLog].reverse().map((roundLog) => (
              <div key={roundLog.round} className="border border-on-surface/8 bg-surface-low p-3">
                <p className="text-on-surface/30 font-display font-bold uppercase tracking-widest text-[10px] mb-2">
                  Runda {roundLog.round}
                </p>
                <div className="flex flex-col gap-1.5">
                  {roundLog.events.map((ev, idx) => (
                    <div key={`${roundLog.round}-${idx}`} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] text-on-surface/25 mt-0.5 shrink-0">
                        {ev.type === "kill"
                          ? "skull"
                          : ev.type === "vote"
                            ? "how_to_vote"
                            : ev.type === "save"
                              ? "medical_services"
                              : "info"}
                      </span>
                      <p className="text-on-surface/60 text-xs font-display leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 &&
        (currentPlayer.isHost || missions.length === 0 || !state.showPoints) &&
        (!gameLog || gameLog.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface/15">
              history
            </span>
            <p className="text-on-surface/30 font-display uppercase tracking-widest text-xs">
              Brak wpisów w dzienniku
            </p>
          </div>
        )}
    </div>
  );
}

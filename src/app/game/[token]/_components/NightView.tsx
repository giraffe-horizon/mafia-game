import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import NightActionPanel, { type ActionState, type MafiaState } from "./NightActionPanel"; // Updated to use _components
import { Card, Badge } from "@/components/ui";

export interface PlayerState {
  isAlive: boolean;
  role?: string;
}

export interface NightViewState {
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
}

export interface NightActionData {
  actionTargets: Array<any>;
  myAction: any;
  actionState: ActionState;
  mafiaState: MafiaState;
}

interface NightViewProps {
  isHost: boolean;
  currentPlayer: PlayerState;
  viewState: NightViewState;
  actionData: NightActionData;
  // Dead spectator props
  players: Array<any>;
}

export default function NightView({
  isHost,
  currentPlayer,
  viewState,
  actionData,
  players,
}: NightViewProps) {
  const { roleVisible, setRoleVisible } = viewState;
  const { actionTargets, myAction, actionState, mafiaState } = actionData;
  return (
    <>
      {/* Role card for non-host players */}
      {!isHost && (
        <div className="mx-5 mt-5">
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
            Twoja rola
          </p>
          <Card
            variant="highlighted"
            onClick={() => setRoleVisible((v) => !v)}
            className="w-full p-5 cursor-pointer transition-all active:scale-[0.98]"
            role="button"
            tabIndex={0}
          >
            {roleVisible ? (
              <div className="flex items-center gap-4">
                <span
                  className={`material-symbols-outlined text-[48px] ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                >
                  {ROLE_ICONS[currentPlayer.role ?? "civilian"]}
                </span>
                <div className="text-left">
                  <p
                    className={`font-typewriter text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                  >
                    {ROLE_LABELS[currentPlayer.role ?? "civilian"]}
                  </p>
                  {currentPlayer.role === "mafia" && (
                    <p className="text-red-400/70 text-xs font-typewriter mt-1">
                      🔴 Twoi wspólnicy są oznaczeni na liście
                    </p>
                  )}
                  <p className="text-slate-500 text-sm mt-1">Stuknij aby ukryć</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2">
                <span className="material-symbols-outlined text-[32px] text-slate-600">
                  visibility_off
                </span>
                <p className="font-typewriter text-slate-500 uppercase tracking-widest text-sm">
                  Stuknij aby zobaczyć rolę
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Night action panel for alive players */}
      {!isHost && currentPlayer.isAlive && (
        <NightActionPanel
          role={roleVisible ? currentPlayer.role || null : null}
          targets={actionTargets}
          myAction={myAction}
          roleHidden={!roleVisible}
          actionState={actionState}
          mafiaState={mafiaState}
        />
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
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
                <span
                  className={`font-bold ${ROLE_COLORS[currentPlayer.role] ?? "text-slate-300"}`}
                >
                  {ROLE_LABELS[currentPlayer.role] ?? currentPlayer.role}
                </span>
              </p>
            )}
          </Card>
          <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">
              visibility
            </span>
            Widok widza — role graczy
          </p>
          <div className="flex flex-col gap-2">
            {players
              .filter((p) => !p.isHost)
              .map((p) => (
                <div
                  key={p.playerId}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-black/20 ${!p.isAlive ? "opacity-50" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${p.isAlive ? "border-slate-700 bg-slate-800" : "border-slate-800 bg-slate-900"}`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-500">
                      {p.isAlive ? "person" : "skull"}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium flex-1 ${p.isAlive ? "text-white" : "text-slate-600 line-through"}`}
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
      )}
    </>
  );
}

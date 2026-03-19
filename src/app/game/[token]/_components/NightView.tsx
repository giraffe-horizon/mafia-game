import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import type { PublicPlayer, Role } from "@/db/types";
import NightActionPanel, {
  type ActionState,
  type MafiaState,
} from "@/app/game/[token]/_components/NightActionPanel";
import DeadSpectatorView from "@/app/game/[token]/_components/DeadSpectatorView";
import { Card, SectionHeader } from "@/components/ui";

export interface PlayerState {
  isAlive: boolean;
  role?: string;
}

export interface NightViewState {
  roleVisible: boolean;
  setRoleVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
}

export interface NightActionData {
  actionTargets: PublicPlayer[];
  myAction: { actionType: string; targetPlayerId: string | null } | null;
  actionState: ActionState;
  mafiaState: MafiaState;
}

interface NightViewProps {
  isHost: boolean;
  currentPlayer: PlayerState;
  viewState: NightViewState;
  actionData: NightActionData;
  players: PublicPlayer[];
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
          <SectionHeader className="pl-1">Twoja rola</SectionHeader>
          <Card
            variant="highlighted"
            onClick={() => setRoleVisible((v) => !v)}
            className="w-full p-5 cursor-pointer transition-all active:scale-[0.98]"
            role="button"
            tabIndex={0}
            aria-label={roleVisible ? "Ukryj rolę" : "Pokaż rolę"}
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
          role={roleVisible ? (currentPlayer.role as Role) || null : null}
          targets={actionTargets}
          myAction={myAction}
          roleHidden={!roleVisible}
          actionState={actionState}
          mafiaState={mafiaState}
        />
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView currentPlayer={currentPlayer} players={players} />
      )}
    </>
  );
}

import type { PublicPlayer, Role } from "@/db/types";
import NightActionPanel, {
  type ActionState,
  type MafiaState,
} from "@/app/game/[token]/_components/NightActionPanel";
import DeadSpectatorView from "@/app/game/[token]/_components/DeadSpectatorView";
import RoleCard from "@/app/game/[token]/_components/RoleCard";

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
        <RoleCard
          role={currentPlayer.role}
          roleVisible={roleVisible}
          onToggle={() => setRoleVisible((v) => !v)}
        />
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

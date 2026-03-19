import type { PublicPlayer, Role } from "@/db/types";
import type {
  NightPlayerState as PlayerState,
  NightViewState,
  NightActionData,
} from "@/features/game/types";
import NightActionPanel from "@/features/game/components/NightActionPanel";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import RoleCard from "@/features/game/components/shared/RoleCard";

export type { PlayerState, NightViewState, NightActionData };

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
  const { roleVisible, toggleRole } = viewState;
  const { actionTargets, myAction, actionState, mafiaState, doctorLastTargetId } = actionData;
  return (
    <>
      {/* Role card for non-host players */}
      {!isHost && (
        <RoleCard role={currentPlayer.role} roleVisible={roleVisible} onToggle={toggleRole} />
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
          doctorLastTargetId={doctorLastTargetId}
        />
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView currentPlayer={currentPlayer} players={players} />
      )}
    </>
  );
}

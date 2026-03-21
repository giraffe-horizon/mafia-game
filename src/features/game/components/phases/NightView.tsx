import type { PublicPlayer, Role } from "@/db/types";
import type {
  NightPlayerState as PlayerState,
  NightViewState,
  NightActionData,
} from "@/features/game/types";
import NightActionPanel from "@/features/game/components/NightActionPanel";
import DeadSpectatorView from "@/features/game/components/shared/DeadSpectatorView";
import RoleCard from "@/features/game/components/shared/RoleCard";
import CivilianNightView from "@/features/game/components/shared/CivilianNightView";

export type { PlayerState, NightViewState, NightActionData };

interface NightViewProps {
  isHost: boolean;
  currentPlayer: PlayerState;
  viewState: NightViewState;
  actionData: NightActionData;
  players: PublicPlayer[];
  round: number;
}

export default function NightView({
  isHost,
  currentPlayer,
  viewState,
  actionData,
  players,
  round,
}: NightViewProps) {
  const { roleVisible, toggleRole } = viewState;
  const {
    actionTargets,
    myAction,
    actionState,
    mafiaState,
    doctorLastTargetId,
    investigatedPlayerIds,
  } = actionData;
  return (
    <>
      {/* Role card for alive non-host players (dead players see all roles via DeadSpectatorView) */}
      {!isHost && currentPlayer.isAlive && (
        <RoleCard role={currentPlayer.role} roleVisible={roleVisible} onToggle={toggleRole} />
      )}

      {/* Night action panel for alive players */}
      {!isHost && currentPlayer.isAlive && (
        <>
          {roleVisible && currentPlayer.role === "civilian" ? (
            <CivilianNightView round={round} />
          ) : (
            <NightActionPanel
              role={roleVisible ? (currentPlayer.role as Role) || null : null}
              targets={actionTargets}
              myAction={myAction}
              roleHidden={!roleVisible}
              actionState={actionState}
              mafiaState={mafiaState}
              doctorLastTargetId={doctorLastTargetId}
              investigatedPlayerIds={investigatedPlayerIds}
            />
          )}
        </>
      )}

      {/* Dead spectator view */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView
          currentPlayer={currentPlayer}
          players={players}
          phase="night"
          round={round}
        />
      )}
    </>
  );
}

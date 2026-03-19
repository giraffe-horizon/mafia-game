import type { PublicPlayer, Role } from "@/db/types";
import type {
  NightPlayerState as PlayerState,
  NightViewState,
  NightActionData,
} from "@/types/game";
import NightActionPanel from "@/components/game/NightActionPanel";
import DeadSpectatorView from "@/components/game/DeadSpectatorView";
import RoleCard from "@/components/game/RoleCard";

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

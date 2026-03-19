"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentPhase } from "@/features/game/hooks/useCurrentPhase";
import { usePlayerState } from "@/features/game/hooks/usePlayerState";
import { useOnboarding } from "@/features/game/hooks/useOnboarding";
import { useGameStore } from "@/features/game/store/gameStore";
import { createHttpGameService, type GameService } from "@/features/game/service";
import OnboardingContainer from "@/features/game/containers/OnboardingContainer";
import LobbyContainer from "@/features/game/containers/LobbyContainer";
import NightContainer from "@/features/game/containers/NightContainer";
import DayContainer from "@/features/game/containers/DayContainer";
import VotingContainer from "@/features/game/containers/VotingContainer";
import ReviewContainer from "@/features/game/containers/ReviewContainer";
import EndContainer from "@/features/game/containers/EndContainer";
import GMPanelContainer from "@/features/game/containers/GMPanelContainer";
import PlayersListContainer from "@/features/game/containers/PlayersListContainer";
import ToastOverlay from "@/features/game/components/shared/ToastOverlay";
import TransitionOverlay from "@/features/game/components/shared/TransitionOverlay";
import GameHeader from "@/features/game/components/GameHeader";
import MissionsList from "@/features/game/components/players/MissionsList";
import SettingsModal from "@/features/game/components/modals/SettingsModal";
import RankingModal from "@/features/game/components/modals/RankingModal";
import { PageLayout } from "@/components/ui";
import { useTransition } from "@/features/game/hooks/useTransition";

// Stateless service — safe to create at module level
const gameService: GameService = createHttpGameService();

export default function GameClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  // Zustand store
  const state = useGameStore((s) => s.state);
  const error = useGameStore((s) => s.error);
  const characters = useGameStore((s) => s.characters);
  const initialize = useGameStore((s) => s.initialize);
  const refetch = useGameStore((s) => s.refetch);
  const leaveGame = useGameStore((s) => s.leaveGame);
  const setChangingDecision = useGameStore((s) => s.setChangingDecision);

  // Derived-state hooks
  const { phase, isLobby, isPlaying, isFinished, round } = useCurrentPhase();
  const { isHost } = usePlayerState();

  // Phase transition screens
  useTransition();

  // UI state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  // Onboarding (character sync for settings modal)
  const { selectedCharacterId, setSelectedCharacterId, handleCharacterUpdate } = useOnboarding({
    token,
    refetch,
    gameService,
  });

  // Initialize store with token and service
  useEffect(() => {
    if (token) {
      initialize(token, gameService);
    }
    return () => {
      useGameStore.getState().stopPolling();
    };
  }, [token, initialize]);

  // Reset changingDecision when phase changes
  useEffect(() => {
    setChangingDecision(false);
  }, [phase, round, setChangingDecision]);

  // Sync selected character from server state
  useEffect(() => {
    if (state?.currentPlayer?.character) {
      setSelectedCharacterId(state.currentPlayer.character.id);
    }
  }, [state?.currentPlayer?.character, setSelectedCharacterId]);

  // Lock body scroll when settings modal is open
  useEffect(() => {
    if (!showSettingsModal) return;
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showSettingsModal]);

  const handleLeave = async () => {
    if (!confirm("Czy na pewno chcesz opuścić grę?")) return;
    const result = await leaveGame();
    if (result.success) {
      router.push("/");
    }
  };

  // Error screen
  if (error) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
        <p className="text-slate-300 font-typewriter text-lg text-center px-8">{error}</p>
        <Link
          href="/"
          className="mt-6 text-primary font-typewriter uppercase tracking-widest text-sm hover:text-primary/80 transition-colors"
        >
          ← Powrót
        </Link>
      </div>
    );
  }

  // Loading screen
  if (!state) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">
          refresh
        </span>
        <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
          Ładowanie...
        </p>
      </div>
    );
  }

  // Onboarding screen
  if (!state.currentPlayer.isSetupComplete && !state.currentPlayer.isHost) {
    return <OnboardingContainer />;
  }

  const { game, currentPlayer, missions } = state;

  return (
    <PageLayout>
      <ToastOverlay />
      <TransitionOverlay />

      <GameHeader
        phase={game.phase}
        round={game.round}
        isHost={isHost}
        currentPlayer={currentPlayer}
        onShowSettings={() => setShowSettingsModal(true)}
        onShowRanking={() => setShowRanking(true)}
      />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-6">
        {isLobby && <LobbyContainer />}
        {isPlaying && phase === "night" && <NightContainer />}
        {isPlaying && phase === "day" && <DayContainer />}
        {isPlaying && phase === "voting" && <VotingContainer />}

        {/* Missions (non-host) */}
        {!isHost && <MissionsList missions={missions} showPoints={state.showPoints} />}

        {isPlaying && phase === "review" && <ReviewContainer />}
        {isFinished && <EndContainer />}

        {/* GM panel */}
        {isPlaying && isHost && <GMPanelContainer />}

        <PlayersListContainer />
      </div>

      <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} token={token} />

      <SettingsModal
        isVisible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        playerInfo={{
          playerNickname: state?.currentPlayer?.nickname || "",
          currentPlayer: {
            isHost: currentPlayer.isHost,
            character: currentPlayer.character ? { id: currentPlayer.character.id } : undefined,
          },
        }}
        characterData={{
          characters,
          selectedCharacterId,
          onCharacterSelect: setSelectedCharacterId,
        }}
        modalActions={{
          onSave: () => handleCharacterUpdate(setShowSettingsModal),
          onLeaveGame: () => {
            setShowSettingsModal(false);
            handleLeave();
          },
        }}
      />
    </PageLayout>
  );
}

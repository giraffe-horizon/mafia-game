"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentPhase } from "@/app/game/[token]/_hooks/useCurrentPhase";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import { useOnboarding } from "@/app/game/[token]/_hooks/useOnboarding";
import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { createHttpGameService, type GameService } from "@/app/game/[token]/_services/gameService";
import OnboardingContainer from "@/app/game/[token]/_containers/OnboardingContainer";
import LobbyContainer from "@/app/game/[token]/_containers/LobbyContainer";
import NightContainer from "@/app/game/[token]/_containers/NightContainer";
import DayContainer from "@/app/game/[token]/_containers/DayContainer";
import VotingContainer from "@/app/game/[token]/_containers/VotingContainer";
import ReviewContainer from "@/app/game/[token]/_containers/ReviewContainer";
import EndContainer from "@/app/game/[token]/_containers/EndContainer";
import GMPanelContainer from "@/app/game/[token]/_containers/GMPanelContainer";
import PlayersListContainer from "@/app/game/[token]/_containers/PlayersListContainer";
import ToastOverlay from "@/app/game/[token]/_components/ToastOverlay";
import GameHeader from "@/app/game/[token]/_components/GameHeader";
import MissionsList from "@/app/game/[token]/_components/MissionsList";
import SettingsModal from "@/app/game/[token]/_components/SettingsModal";
import RankingModal from "@/app/game/[token]/_components/RankingModal";
import { PageLayout } from "@/components/ui";

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

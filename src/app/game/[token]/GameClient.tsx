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
import TabsContainer from "@/features/game/containers/TabsContainer";
import GMPanelContainer from "@/features/game/containers/GMPanelContainer";
import EndContainer from "@/features/game/containers/EndContainer";
import ToastOverlay from "@/features/game/components/shared/ToastOverlay";
import TransitionOverlay from "@/features/game/components/shared/TransitionOverlay";
import GameHeader from "@/features/game/components/GameHeader";
import SettingsModal from "@/features/game/components/modals/SettingsModal";
import RankingModal from "@/features/game/components/modals/RankingModal";
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
  const { phase, isFinished, round } = useCurrentPhase();
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
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
        <p className="text-on-surface/60 font-display text-lg text-center px-8">{error}</p>
        <Link
          href="/"
          className="mt-6 text-primary font-display uppercase tracking-widest text-sm hover:text-primary/80 transition-colors"
        >
          ← Powrót
        </Link>
      </div>
    );
  }

  // Loading screen
  if (!state) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background">
        <div className="border border-surface-highest p-8 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
            refresh
          </span>
          <p className="text-on-surface/40 font-display uppercase tracking-widest text-xs">
            Ładowanie dossier...
          </p>
        </div>
      </div>
    );
  }

  // Onboarding screen
  if (!state.currentPlayer.isSetupComplete && !state.currentPlayer.isHost) {
    return <OnboardingContainer />;
  }

  const { game, currentPlayer } = state;

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

      {/* End screen overlay */}
      {isFinished && <EndContainer />}

      {/* Tab-based layout (always rendered, even on end screen as background) */}
      {!isFinished && (
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          <TabsContainer />

          {/* GM panel overlay — accessible from header */}
          {isHost && <GMPanelContainer />}
        </div>
      )}

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

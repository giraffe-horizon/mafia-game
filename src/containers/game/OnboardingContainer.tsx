"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useGameStore } from "@/stores/game/gameStore";
import { useOnboarding } from "@/hooks/game/useOnboarding";
import { createHttpGameService } from "@/services/game/gameService";
import OnboardingScreen, {
  type FormData,
  type CharacterSelection,
  type LoadingState,
} from "@/components/game/OnboardingScreen";

const gameService = createHttpGameService();

export default function OnboardingContainer() {
  const { token } = useParams<{ token: string }>();
  const state = useGameStore((s) => s.state);
  const characters = useGameStore((s) => s.characters);
  const refetch = useGameStore((s) => s.refetch);

  const {
    onboardingNickname,
    selectedCharacterId,
    onboardingLoading,
    onboardingError,
    setOnboardingNickname,
    setSelectedCharacterId,
    handleSetup,
  } = useOnboarding({ token, refetch, gameService });

  useEffect(() => {
    if (state?.currentPlayer?.character) {
      setSelectedCharacterId(state.currentPlayer.character.id);
    }
  }, [state?.currentPlayer?.character, setSelectedCharacterId]);

  if (!state) return null;

  const formData: FormData = {
    onboardingNickname,
    onNicknameChange: setOnboardingNickname,
  };

  const characterSelection: CharacterSelection = {
    characters,
    selectedCharacterId,
    onCharacterSelect: setSelectedCharacterId,
    takenCharacterIds: state.takenCharacterIds,
  };

  const loadingState: LoadingState = {
    onboardingLoading,
    onboardingError,
  };

  return (
    <OnboardingScreen
      gameCode={state.game.code}
      formData={formData}
      characterSelection={characterSelection}
      loadingState={loadingState}
      onSubmit={handleSetup}
    />
  );
}

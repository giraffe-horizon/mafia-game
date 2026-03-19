"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useGameStore } from "@/features/game/store/gameStore";
import { useOnboarding } from "@/features/game/hooks/useOnboarding";
import { createHttpGameService } from "@/features/game/service";
import OnboardingScreen, {
  type FormData,
  type CharacterSelection,
  type LoadingState,
} from "@/features/game/components/lobby/OnboardingScreen";

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

  // Sync character selection from server only when character ID actually changes
  const characterId = state?.currentPlayer?.character?.id;
  useEffect(() => {
    if (characterId) {
      setSelectedCharacterId(characterId);
    }
  }, [characterId, setSelectedCharacterId]);

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

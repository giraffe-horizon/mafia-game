import { useState } from "react";
import * as apiClient from "@/lib/api-client";

interface UseOnboardingParams {
  token: string;
  refetch: () => Promise<void>;
}

interface UseOnboardingReturn {
  onboardingNickname: string;
  selectedCharacterId: string | null;
  onboardingLoading: boolean;
  onboardingError: string;
  setOnboardingNickname: (nickname: string) => void;
  setSelectedCharacterId: (id: string | null) => void;
  setOnboardingError: (error: string) => void;
  handleSetup: () => Promise<void>;
  handleCharacterUpdate: (setShowSettingsModal: (show: boolean) => void) => Promise<void>;
}

export function useOnboarding({ token, refetch }: UseOnboardingParams): UseOnboardingReturn {
  const [onboardingNickname, setOnboardingNickname] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  const handleSetup = async () => {
    if (!onboardingNickname.trim()) {
      setOnboardingError("Podaj swoje imię");
      return;
    }
    if (!selectedCharacterId) {
      setOnboardingError("Wybierz postać");
      return;
    }
    setOnboardingError("");
    setOnboardingLoading(true);
    try {
      await apiClient.setupPlayer(token, {
        nickname: onboardingNickname.trim(),
        characterId: selectedCharacterId,
      });
      await refetch();
    } catch (error) {
      setOnboardingError(error instanceof Error ? error.message : "Błąd połączenia");
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleCharacterUpdate = async (setShowSettingsModal: (show: boolean) => void) => {
    if (!selectedCharacterId) return;
    try {
      await apiClient.updateCharacter(token, { characterId: selectedCharacterId });
      setShowSettingsModal(false);
      refetch();
    } catch {
      /* silent */
    }
  };

  return {
    onboardingNickname,
    selectedCharacterId,
    onboardingLoading,
    onboardingError,
    setOnboardingNickname,
    setSelectedCharacterId,
    setOnboardingError,
    handleSetup,
    handleCharacterUpdate,
  };
}

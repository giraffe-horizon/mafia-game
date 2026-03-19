import { useState } from "react";
import type { GameService } from "@/app/game/[token]/_services/gameService";
import { getErrorMessage } from "@/lib/errors";

interface UseOnboardingParams {
  token: string;
  refetch: () => Promise<void>;
  gameService: GameService;
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

export function useOnboarding({
  token,
  refetch,
  gameService,
}: UseOnboardingParams): UseOnboardingReturn {
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
      await gameService.setupPlayer(token, onboardingNickname.trim(), selectedCharacterId);
      await refetch();
    } catch (error) {
      setOnboardingError(getErrorMessage(error));
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleCharacterUpdate = async (setShowSettingsModal: (show: boolean) => void) => {
    if (!selectedCharacterId) return;
    try {
      await gameService.updateCharacter(token, selectedCharacterId);
      setShowSettingsModal(false);
      await refetch();
    } catch (error) {
      setOnboardingError(getErrorMessage(error, "Błąd aktualizacji postaci"));
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

"use client";

import CharacterPicker from "@/components/CharacterPicker";
import { Button, PageLayout, FormField } from "@/components/ui";

export interface FormData {
  onboardingNickname: string;
  onNicknameChange: (v: string) => void;
}

export interface CharacterSelection {
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;
  selectedCharacterId: string | null;
  onCharacterSelect: (id: string | null) => void;
  takenCharacterIds: string[];
}

export interface LoadingState {
  onboardingLoading: boolean;
  onboardingError: string;
}

interface OnboardingScreenProps {
  gameCode: string;
  formData: FormData;
  characterSelection: CharacterSelection;
  loadingState: LoadingState;
  onSubmit: () => void;
}

export default function OnboardingScreen({
  gameCode,
  formData,
  characterSelection,
  loadingState,
  onSubmit,
}: OnboardingScreenProps) {
  const { onboardingNickname, onNicknameChange } = formData;
  const { characters, selectedCharacterId, onCharacterSelect, takenCharacterIds } =
    characterSelection;
  const { onboardingLoading, onboardingError } = loadingState;
  return (
    <PageLayout>
      <div className="relative z-20 flex items-center p-4 pb-2 justify-between">
        <div className="size-12 shrink-0 opacity-0 pointer-events-none" />
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-display text-stamp drop-shadow-[0_0_8px_rgba(255,180,172,0.5)]">
          DOŁĄCZANIE DO GRY
        </h2>
        <div className="size-12 shrink-0" />
      </div>

      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 border-2 border-stamp/40 flex items-center justify-center bg-background/80 shadow-[0_0_30px_rgba(255,180,172,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-stamp/10 blur-xl" />
            <span className="material-symbols-outlined text-[48px] text-stamp relative z-10 drop-shadow-md">
              person_add
            </span>
          </div>
        </div>

        <p className="text-on-surface text-center font-display mb-8 leading-relaxed">
          Kod sesji: <span className="text-stamp font-bold">{gameCode}</span>
          <br />
          Wybierz swoje imię i postać
        </p>

        <div className="flex flex-col gap-4 w-full mb-6">
          <FormField label="PSEUDONIM OPERACYJNY:">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-dim">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </span>
              <input
                className="flex w-full text-on-surface focus:outline-none focus:ring-2 focus:ring-stamp/50 border border-stamp/30 bg-surface-lowest h-14 placeholder:text-on-surface-dim pl-12 pr-4 text-lg font-medium leading-normal transition-all font-display"
                placeholder="Policjant..."
                type="text"
                value={onboardingNickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </div>
          </FormField>

          {characters.length > 0 && (
            <FormField label="TOŻSAMOŚĆ AGENTA:" className="[&>p]:pb-3">
              <CharacterPicker
                characters={characters}
                selectedId={selectedCharacterId}
                onSelect={onCharacterSelect}
                disabledIds={takenCharacterIds}
              />
            </FormField>
          )}

          {onboardingError && (
            <p className="text-stamp text-sm font-display pl-1 animate-pulse">{onboardingError}</p>
          )}
        </div>

        <Button
          onClick={onSubmit}
          disabled={onboardingLoading || !onboardingNickname.trim() || !selectedCharacterId}
          size="lg"
          loading={onboardingLoading}
          icon="login"
          className="w-full"
        >
          {onboardingLoading ? "Dołączam..." : "Dołącz do gry"}
        </Button>
      </div>
    </PageLayout>
  );
}

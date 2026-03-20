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
          <div className="w-28 h-28 border-2 border-stamp/50 flex items-center justify-center bg-stamp/5 shadow-[0_0_40px_rgba(255,180,172,0.3)] relative overflow-hidden paper-grain">
            <div className="absolute inset-0 bg-gradient-radial from-stamp/20 to-transparent" />
            <span className="material-symbols-outlined text-[56px] text-stamp relative z-10 drop-shadow-lg opacity-90">
              person_add
            </span>
          </div>
        </div>

        <p className="text-on-surface text-center font-display mb-8 leading-relaxed">
          Kod sesji: <span className="text-stamp font-bold">{gameCode}</span>
          <br />
          Wybierz swoje imię i postać
        </p>

        <div className="flex flex-col gap-4 w-full mb-6 paper-card p-4 border border-stamp/20">
          <FormField label="PSEUDONIM OPERACYJNY:">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-on-paper-dim">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </span>
              <input
                className="flex w-full text-on-paper focus:outline-none bg-transparent border-0 border-b-2 border-b-on-paper/30 focus:border-b-stamp h-14 placeholder:text-on-paper-dim pl-10 pr-4 text-lg font-medium leading-normal transition-all font-display"
                placeholder="Agent..."
                type="text"
                value={onboardingNickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </div>
            <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-paper/50 mt-1">
              WYPEŁNIĆ PISMEM DRUKOWANYM
            </p>
          </FormField>

          {characters.length > 0 && (
            <FormField label="DOSTĘPNE WIZERUNKI OPERACYJNE:" className="[&>p]:pb-3">
              <div className="max-h-[45vh] overflow-y-auto">
                <CharacterPicker
                  characters={characters}
                  selectedId={selectedCharacterId}
                  onSelect={onCharacterSelect}
                  disabledIds={takenCharacterIds}
                />
              </div>
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

        <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-surface/20 text-center mt-4">
          ZATWIERDZENIE PIECZĘCIĄ GŁÓWNĄ // V.3
        </p>
      </div>
    </PageLayout>
  );
}

"use client";

import CharacterPicker from "@/components/CharacterPicker";
import { Button, PageLayout } from "@/components/ui";

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
      {/* Classification bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2 border-b border-on-surface/8">
        <span className="text-on-surface/20 font-display text-[9px] uppercase tracking-widest">
          Weryfikacja tożsamości
        </span>
        <span className="stamp stamp-red text-[9px] py-0 px-1.5">NOWY AGENT</span>
        <span className="text-on-surface/20 font-display text-[9px] uppercase tracking-widest">
          {gameCode}
        </span>
      </div>

      <div className="relative z-20 flex-1 flex flex-col px-5 pt-6 pb-8 overflow-y-auto">
        {/* Dossier header */}
        <div className="border border-on-surface/15 bg-surface-low p-4 mb-6 tape-corner">
          <p className="text-on-surface/30 font-display font-bold uppercase tracking-widest text-[9px] mb-1">
            Formularz rekrutacyjny
          </p>
          <p className="font-display font-bold text-xl uppercase tracking-wider text-on-surface">
            Dołączanie do operacji
          </p>
          <p className="text-on-surface/35 font-display text-xs mt-1">
            Kod sesji: <span className="font-bold text-stamp tracking-widest">{gameCode}</span>
          </p>
        </div>

        {/* Pseudonym field */}
        <div className="mb-5">
          <p className="text-on-surface/40 font-display font-bold uppercase tracking-widest text-[10px] mb-2">
            Pseudonim operacyjny:
          </p>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-on-surface/25">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </span>
            <input
              className="w-full bg-surface-low border border-on-surface/20 text-on-surface focus:outline-none focus:border-stamp focus:bg-stamp/5 h-12 pl-10 pr-4 font-display text-base uppercase tracking-wider placeholder:text-on-surface/20 placeholder:normal-case placeholder:tracking-normal"
              placeholder="Twój pseudonim..."
              type="text"
              value={onboardingNickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>
        </div>

        {/* Character picker */}
        {characters.length > 0 && (
          <div className="mb-5">
            <p className="text-on-surface/40 font-display font-bold uppercase tracking-widest text-[10px] mb-2">
              Tożsamość operacyjna (wybierz postać):
            </p>
            <CharacterPicker
              characters={characters}
              selectedId={selectedCharacterId}
              onSelect={onCharacterSelect}
              disabledIds={takenCharacterIds}
            />
          </div>
        )}

        {onboardingError && (
          <p className="text-stamp text-xs font-display mb-4 uppercase tracking-wider">
            {onboardingError}
          </p>
        )}

        <Button
          onClick={onSubmit}
          disabled={onboardingLoading || !onboardingNickname.trim() || !selectedCharacterId}
          size="lg"
          loading={onboardingLoading}
          icon="login"
          className="w-full mt-auto"
        >
          {onboardingLoading ? "Weryfikacja..." : "Potwierdź tożsamość"}
        </Button>
      </div>
    </PageLayout>
  );
}

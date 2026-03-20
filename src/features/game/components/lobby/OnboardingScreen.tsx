"use client";

import CharacterPicker from "@/components/CharacterPicker";
import { PageLayout } from "@/components/ui";

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

        <div
          className="flex flex-col gap-4 w-full mb-6 p-4 border border-stamp/20"
          style={{ backgroundColor: "#D5C4B1" }}
        >
          <div className="flex flex-col">
            <label
              className="block font-display text-[16px] font-bold uppercase mb-2"
              style={{ color: "#1A1A1A" }}
            >
              PSEUDONIM OPERACYJNY:
            </label>
            <input
              className="flex w-full bg-transparent border-none focus:outline-none h-14 pr-4 text-lg font-medium leading-normal transition-all font-display"
              style={{
                borderBottom: "1px solid #1A1A1A",
                color: "#1A1A1A",
              }}
              placeholder="Agent..."
              type="text"
              value={onboardingNickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>

          {characters.length > 0 && (
            <div className="flex flex-col">
              <label
                className="block font-display text-[16px] font-bold uppercase mb-3"
                style={{ color: "#1A1A1A" }}
              >
                DOSTĘPNE WIZERUNKI OPERACYJNE:
              </label>
              <div className="max-h-[45vh] overflow-y-auto">
                <CharacterPicker
                  characters={characters}
                  selectedId={selectedCharacterId}
                  onSelect={onCharacterSelect}
                  disabledIds={takenCharacterIds}
                />
              </div>
            </div>
          )}

          {onboardingError && (
            <p className="text-sm font-display pl-1 animate-pulse" style={{ color: "#D94F3B" }}>
              {onboardingError}
            </p>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={onboardingLoading || !onboardingNickname.trim() || !selectedCharacterId}
          className="w-full h-16 font-bold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: "#F0B8AE",
            color: "#D4564C",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "6px",
          }}
        >
          {onboardingLoading && (
            <span className="material-symbols-outlined text-[32px]">hourglass_empty</span>
          )}
          <span className="uppercase font-display">
            {onboardingLoading ? "DOŁĄCZAM..." : "DOŁĄCZ"}
          </span>
        </button>

        <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-surface/20 text-center mt-4">
          ZATWIERDZENIE PIECZĘCIĄ GŁÓWNĄ // V.3
        </p>
      </div>
    </PageLayout>
  );
}

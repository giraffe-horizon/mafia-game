"use client";

import CharacterPicker from "@/components/CharacterPicker";
export default function OnboardingScreen({
  gameCode,
  characters,
  onboardingNickname,
  selectedCharacterId,
  onboardingLoading,
  onboardingError,
  takenCharacterIds,
  onNicknameChange,
  onCharacterSelect,
  onSubmit,
}: {
  gameCode: string;
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    name_pl: string;
    avatar_url: string;
  }>;
  onboardingNickname: string;
  selectedCharacterId: string | null;
  onboardingLoading: boolean;
  onboardingError: string;
  takenCharacterIds: string[];
  onNicknameChange: (v: string) => void;
  onCharacterSelect: (id: string | null) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-dark overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-20 flex items-center p-4 pb-2 justify-between">
        <div className="size-12 shrink-0 opacity-0 pointer-events-none" />
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-typewriter text-primary drop-shadow-[0_0_8px_rgba(218,11,11,0.5)]">
          DOŁĄCZANIE DO GRY
        </h2>
        <div className="size-12 shrink-0" />
      </div>

      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background-dark/80 shadow-[0_0_30px_rgba(218,11,11,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            <span className="material-symbols-outlined text-[48px] text-primary relative z-10 drop-shadow-md">
              person_add
            </span>
          </div>
        </div>

        <p className="text-slate-300 text-center font-typewriter mb-8 leading-relaxed">
          Kod sesji: <span className="text-primary font-bold">{gameCode}</span>
          <br />
          Wybierz swoje imię i postać
        </p>

        <div className="flex flex-col gap-4 w-full mb-6">
          <label className="flex flex-col w-full group/input">
            <p className="text-slate-400 text-sm font-typewriter leading-normal pb-2 uppercase tracking-widest pl-1 transition-colors group-focus-within/input:text-primary">
              Twoje imię
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </span>
              <input
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/30 bg-black/40 backdrop-blur-sm h-14 placeholder:text-slate-600 pl-12 pr-4 text-lg font-medium leading-normal transition-all"
                placeholder="Detektyw..."
                type="text"
                value={onboardingNickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
            </div>
          </label>

          {characters.length > 0 && (
            <div className="flex flex-col w-full">
              <p className="text-slate-400 text-sm font-typewriter leading-normal pb-3 uppercase tracking-widest pl-1">
                Wybierz postać
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
            <p className="text-primary text-sm font-typewriter pl-1 animate-pulse">
              {onboardingError}
            </p>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={onboardingLoading || !onboardingNickname.trim() || !selectedCharacterId}
          className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold leading-normal tracking-[0.02em] transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] hover:shadow-[0_6px_20px_rgba(218,11,11,0.23)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">login</span>
          <span className="truncate uppercase font-typewriter tracking-wider">
            {onboardingLoading ? "Dołączam..." : "Dołącz do gry"}
          </span>
        </button>
      </div>
    </div>
  );
}

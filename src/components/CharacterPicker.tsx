"use client";

// No React hooks needed

interface Character {
  id: string;
  slug: string;
  name: string;
  name_pl: string;
  gender?: string;
  description?: string | null;
  avatar_url: string;
  is_active?: number;
  sort_order?: number;
}

interface CharacterPickerProps {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabledIds?: string[];
}

export default function CharacterPicker({
  characters,
  selectedId,
  onSelect,
  disabledIds = [],
}: CharacterPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {characters.map((character) => {
        const isSelected = selectedId === character.id;
        const isDisabled = disabledIds.includes(character.id);
        return (
          <button
            key={character.id}
            onClick={() => !isDisabled && onSelect(character.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all relative ${
              isDisabled
                ? "opacity-40 grayscale pointer-events-none border-slate-600 bg-black/20"
                : isSelected
                  ? "border-primary bg-primary/10"
                  : "border-slate-600 hover:border-slate-400 bg-black/20 hover:bg-black/40"
            }`}
          >
            <div className="relative">
              {character.avatar_url ? (
                <>
                  <img
                    src={character.avatar_url}
                    alt={character.name_pl}
                    className={`w-16 h-16 rounded-full border-2 transition-all ${
                      isSelected ? "border-primary" : "border-slate-600"
                    }`}
                    onError={(e) => {
                      // Hide image and show placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const placeholder =
                        target.parentElement?.querySelector(".avatar-placeholder");
                      if (placeholder) (placeholder as HTMLElement).style.display = "flex";
                    }}
                  />
                  <div
                    className={`avatar-placeholder hidden w-16 h-16 rounded-full bg-primary/20 text-primary font-bold items-center justify-center border-2 transition-all ${
                      isSelected ? "border-primary" : "border-slate-600"
                    }`}
                  >
                    {character.name_pl.charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <div
                  className={`w-16 h-16 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border-2 transition-all ${
                    isSelected ? "border-primary" : "border-slate-600"
                  }`}
                >
                  {character.name_pl.charAt(0).toUpperCase()}
                </div>
              )}
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                </div>
              )}
            </div>
            <span
              className={`text-xs text-center font-medium leading-tight ${
                isSelected ? "text-white" : "text-slate-300"
              }`}
            >
              {character.name_pl}
            </span>
          </button>
        );
      })}
    </div>
  );
}

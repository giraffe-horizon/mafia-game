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
}

export default function CharacterPicker({
  characters,
  selectedId,
  onSelect,
}: CharacterPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {characters.map((character) => {
        const isSelected = selectedId === character.id;
        return (
          <button
            key={character.id}
            onClick={() => onSelect(character.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-slate-600 hover:border-slate-400 bg-black/20 hover:bg-black/40"
            }`}
          >
            <img
              src={character.avatar_url}
              alt={character.name_pl}
              className={`w-16 h-16 rounded-full border-2 transition-all ${
                isSelected ? "border-primary" : "border-slate-600"
              }`}
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" fill="%23cbd5e1"/>
                  </svg>`
                )}`;
              }}
            />
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

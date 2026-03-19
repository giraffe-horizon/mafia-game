"use client";

import { useState, useCallback } from "react";

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
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const handleImgError = useCallback((id: string) => {
    setErrorIds((prev) => new Set(prev).add(id));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      {characters.map((character) => {
        const isSelected = selectedId === character.id;
        const isDisabled = disabledIds.includes(character.id);
        const hasImgError = errorIds.has(character.id);
        return (
          <button
            type="button"
            key={character.id}
            onClick={() => !isDisabled && onSelect(character.id)}
            disabled={isDisabled}
            className={`relative flex flex-col items-center gap-0 transition-all focus:outline-none ${
              isDisabled ? "cursor-not-allowed opacity-70" : "hover:scale-[1.02]"
            }`}
          >
            {/* Polaroid frame */}
            <div
              className={`w-full bg-secondary p-1.5 pb-0 border-2 transition-all ${
                isSelected
                  ? "border-primary shadow-[0_0_0_3px_var(--color-primary)] scale-[1.03]"
                  : isDisabled
                    ? "border-surface-highest grayscale"
                    : "border-surface-highest hover:border-on-surface/40"
              }`}
            >
              {/* Photo area */}
              <div className="relative w-full aspect-square bg-surface-low overflow-hidden">
                {character.avatar_url && !hasImgError ? (
                  <img
                    src={character.avatar_url}
                    alt={character.name_pl}
                    loading="lazy"
                    decoding="async"
                    className={`w-full h-full object-cover transition-all ${
                      isDisabled
                        ? "grayscale brightness-50"
                        : isSelected
                          ? "brightness-100"
                          : "brightness-75"
                    }`}
                    onError={() => handleImgError(character.id)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-low">
                    <span className="font-display font-black text-3xl text-on-surface/30 uppercase">
                      {character.name_pl.charAt(0)}
                    </span>
                  </div>
                )}

                {/* ZAJĘTE stamp overlay */}
                {isDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rotate-[-15deg]">
                      <span className="font-display font-black text-[11px] uppercase tracking-widest border-2 border-red-600 text-red-600 px-1.5 py-0.5 opacity-90 bg-black/30">
                        ZAJĘTE
                      </span>
                    </div>
                  </div>
                )}

                {/* WYBRANO stamp overlay */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                    <div className="rotate-[-10deg]">
                      <span className="font-display font-black text-sm uppercase tracking-widest border-2 border-primary text-primary px-2 py-1 bg-black/50 shadow-lg">
                        WYBRANO
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Polaroid label strip */}
              <div className="py-1.5 px-1">
                <span
                  className={`font-display text-[10px] uppercase tracking-wider text-center block truncate font-black ${
                    isSelected
                      ? "text-primary"
                      : isDisabled
                        ? "text-on-secondary/40"
                        : "text-on-secondary"
                  }`}
                >
                  {character.name_pl}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="grid grid-cols-4 gap-3">
      {characters.map((character, idx) => {
        const isSelected = selectedId === character.id;
        const isDisabled = disabledIds.includes(character.id);
        const hasImgError = errorIds.has(character.id);

        // Slight alternating rotation for Polaroid asymmetry
        const rotation = idx % 3 === 0 ? "-1.5deg" : idx % 3 === 1 ? "1deg" : "-0.5deg";

        return (
          <button
            type="button"
            key={character.id}
            onClick={() => !isDisabled && onSelect(character.id)}
            className={`flex flex-col items-stretch relative transition-all ${
              isDisabled
                ? "opacity-50 grayscale pointer-events-none"
                : isSelected
                  ? "scale-105"
                  : "hover:scale-102"
            }`}
            style={{
              transform: `rotate(${rotation})`,
              ...(isSelected ? { transform: "rotate(0deg) scale(1.05)" } : {}),
            }}
          >
            {/* Polaroid frame */}
            <div
              className={`bg-paper p-1 pb-3 border-2 ${
                isSelected ? "border-stamp" : "border-paper"
              }`}
            >
              {/* Photo area */}
              <div className="w-full aspect-square bg-background overflow-hidden">
                {character.avatar_url && !hasImgError ? (
                  <img
                    src={character.avatar_url}
                    alt={character.name_pl}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={() => handleImgError(character.id)}
                  />
                ) : (
                  <div className="w-full h-full bg-stamp/20 flex items-center justify-center">
                    <span className="text-stamp font-bold text-lg font-display">
                      {character.name_pl.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Polaroid caption strip */}
              <div className="mt-1.5 px-0.5">
                <span
                  className={`block text-center text-[9px] font-display truncate ${
                    isSelected ? "text-stamp font-bold" : "text-on-paper/70"
                  }`}
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  {character.name_pl}
                </span>
              </div>
            </div>

            {/* ZAJĘTE stamp overlay */}
            {isDisabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="stamp stamp-red text-[9px] px-1.5 py-0.5"
                  style={{ transform: "rotate(-15deg)" }}
                >
                  ZAJĘTE
                </span>
              </div>
            )}

            {/* Selected: tape corner accent */}
            {isSelected && (
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2.5 pointer-events-none"
                style={{
                  background: "rgba(215,195,176,0.7)",
                  transform: "translateX(-50%) rotate(-0.5deg)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

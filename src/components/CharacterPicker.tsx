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
    <div className="grid grid-cols-3" style={{ gap: "20px" }}>
      {characters.map((character, _index) => {
        const isSelected = selectedId === character.id;
        const isDisabled = disabledIds.includes(character.id);
        const hasImgError = errorIds.has(character.id);
        // Deterministic rotation based on index
        const rotations = [-3, 4, 2, -2, -4, 3];
        const rotationDegrees = rotations[_index % rotations.length];
        return (
          <button
            type="button"
            key={character.id}
            onClick={() => !isDisabled && onSelect(character.id)}
            disabled={isDisabled}
            aria-label={`Postać: ${character.name_pl}, ${
              isSelected ? "wybrana" : isDisabled ? "zajęta" : "dostępna"
            }`}
            className={`relative flex flex-col items-center gap-0 transition-all focus:outline-none ${
              isDisabled ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {/* Polaroid frame */}
            <div
              className={`relative w-full transition-all ${isSelected ? "scale-[1.03]" : ""}`}
              style={{
                transform: `rotate(${rotationDegrees}deg)`,
                backgroundColor: "#FFFFFF",
                padding: "8px 8px 28px 8px",
                boxShadow: "2px 3px 8px rgba(0,0,0,0.25)",
              }}
            >
              {/* Tape corner */}
              <div
                className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 rotate-[-2deg]"
                style={{
                  width: "60px",
                  height: "18px",
                  backgroundColor: "rgba(200,200,190,0.55)",
                }}
              ></div>
              {/* Photo area */}
              <div className="relative w-full aspect-square bg-surface-low overflow-hidden">
                {character.avatar_url && !hasImgError ? (
                  <img
                    src={character.avatar_url}
                    alt={character.name_pl}
                    loading="lazy"
                    decoding="async"
                    className={`w-full h-full object-cover transition-all ${
                      isDisabled ? "brightness-50 opacity-50" : ""
                    }`}
                    style={{
                      filter: "grayscale(100%)",
                    }}
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
                    <span
                      className="font-display font-bold uppercase border-[3px] px-2 py-1"
                      style={{
                        fontSize: "28px",
                        color: "#C96B64",
                        borderColor: "#C96B64",
                        transform: "rotate(-18deg)",
                        opacity: 0.85,
                        fontWeight: 700,
                      }}
                    >
                      ZAJĘTE
                    </span>
                  </div>
                )}

                {/* WYBRANO stamp overlay */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                    <span className="stamp text-primary border-primary bg-black/50 shadow-lg">
                      WYBRANO
                    </span>
                  </div>
                )}
              </div>

              {/* Polaroid label strip */}
              <div className="py-1.5 px-1 text-center">
                <span
                  className="font-display text-[10px] uppercase tracking-wider block truncate font-black"
                  style={{ color: "#1A1A1A" }}
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

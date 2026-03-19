"use client";

import { useState, useCallback } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { PublicPlayer } from "@/db";
import { Badge } from "@/components/ui";

export default function PlayerRow({
  player,
  isGamePlaying,
  isFinished,
  isLobby,
  isHost,
  currentPlayerRole,
  roleVisible,
  onKick,
  onRename,
  investigated,
}: {
  player: PublicPlayer;
  isGamePlaying: boolean;
  isFinished: boolean;
  isLobby: boolean;
  isHost: boolean;
  currentPlayerRole?: string | null;
  roleVisible?: boolean;
  onKick?: (playerId: string) => void;
  onRename?: (newNickname: string) => void;
  investigated?: boolean | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState(player.nickname);
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const handleSaveRename = () => {
    const trimmedName = editNickname.trim();
    if (trimmedName.length >= 1 && trimmedName.length <= 20 && trimmedName !== player.nickname) {
      onRename?.(trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditNickname(player.nickname);
    setIsEditing(false);
  };

  const isChoosingCharacter = !player.nickname && !player.character;
  const hasNicknameNoCharacter = player.nickname && !player.character;

  const showRoleBadge = isHost && isGamePlaying && player.role != null && !isChoosingCharacter;

  const isMafiaTeammate =
    !isHost &&
    !player.isYou &&
    !player.isHost &&
    player.role === "mafia" &&
    currentPlayerRole === "mafia" &&
    roleVisible === true;

  return (
    <div
      className={`flex items-center gap-3 p-3 border transition-all ${
        player.isYou ? "border-stamp/30 bg-stamp/5" : "border-on-surface/10 bg-surface-low"
      } ${!player.isAlive ? "opacity-40" : ""}`}
    >
      {/* Polaroid-style avatar */}
      <div
        className={`shrink-0 relative ${
          isChoosingCharacter || hasNicknameNoCharacter ? "animate-pulse" : ""
        }`}
        style={{ transform: player.isYou ? "rotate(-1deg)" : undefined }}
      >
        {player.character ? (
          <div className="bg-paper p-0.5 pb-2" style={{ width: "36px" }}>
            {player.character.avatarUrl && !imgError ? (
              <img
                src={player.character.avatarUrl}
                alt={player.character.namePl}
                loading="lazy"
                decoding="async"
                className="w-[28px] h-[28px] object-cover block"
                onError={handleImgError}
              />
            ) : (
              <div className="w-[28px] h-[28px] bg-stamp/20 flex items-center justify-center">
                <span className="text-stamp font-bold text-xs font-display">
                  {player.character.namePl.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`w-9 h-9 flex items-center justify-center border ${
              player.isHost ? "border-stamp/40 bg-stamp/10" : "border-on-surface/20 bg-background"
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface/30">
              {isChoosingCharacter || hasNicknameNoCharacter
                ? "hourglass_top"
                : player.isHost
                  ? "stars"
                  : "person"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing && isLobby && player.isYou ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="bg-background border border-on-surface/30 px-2 py-1 text-sm text-on-surface max-w-[120px] font-display focus:outline-none focus:border-stamp"
                placeholder="Nazwa gracza"
                maxLength={20}
                autoFocus
              />
              <button
                onClick={handleSaveRename}
                className="text-green-400 hover:text-green-300"
                title="Zapisz"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-on-surface/40 hover:text-on-surface/70"
                title="Anuluj"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                {isChoosingCharacter ? (
                  <span className="text-sm font-display text-on-surface/30 italic animate-pulse">
                    Wybiera postać...
                  </span>
                ) : (
                  <>
                    <span className="text-sm font-display font-bold text-on-surface truncate uppercase tracking-wide">
                      {player.nickname}
                    </span>
                    {player.isYou && (
                      <span className="text-[10px] font-display text-stamp/60 uppercase tracking-widest">
                        (Ty)
                      </span>
                    )}
                  </>
                )}
              </div>
              {/* Character name as agent codename */}
              {player.character && (
                <span className="text-[10px] font-display text-on-surface/30 uppercase tracking-wider">
                  {player.character.namePl}
                </span>
              )}
              {/* Dead status */}
              {!player.isAlive && (
                <span className="text-[10px] font-display text-on-surface/30 uppercase tracking-widest">
                  Wyeliminowany
                </span>
              )}
            </div>
          )}
          {isMafiaTeammate && (
            <span
              className="material-symbols-outlined text-[14px] text-stamp/70"
              title="Członek mafii"
            >
              group
            </span>
          )}
        </div>
      </div>

      {/* Investigation badges (detective stamps) */}
      {investigated === true && (
        <span
          className="stamp stamp-red text-[8px] py-0 px-1"
          style={{ transform: "rotate(-2deg)" }}
          title="Mafia"
        >
          MAFIA
        </span>
      )}
      {investigated === false && (
        <span
          className="stamp stamp-green text-[8px] py-0 px-1"
          style={{ transform: "rotate(2deg)" }}
          title="Niewinny"
        >
          CZYSTA
        </span>
      )}

      {/* Role badge */}
      {showRoleBadge && player.role && (
        <Badge variant={player.role as "mafia" | "detective" | "doctor" | "civilian"}>
          {ROLE_LABELS[player.role]}
        </Badge>
      )}
      {isFinished && !isHost && player.role && !isChoosingCharacter && (
        <Badge variant={player.role as "mafia" | "detective" | "doctor" | "civilian"}>
          {ROLE_LABELS[player.role]}
        </Badge>
      )}

      {/* Kick button */}
      {isLobby && isHost && !player.isHost && onKick && (
        <button
          onClick={() => onKick(player.playerId)}
          className="size-8 flex items-center justify-center text-on-surface/25 hover:text-stamp border border-transparent hover:border-stamp/30"
          title="Usuń gracza"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}

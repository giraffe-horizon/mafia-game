"use client";

import { useState, useCallback } from "react";
import { ROLE_LABELS, MAX_NICKNAME_LENGTH } from "@/lib/constants";
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
    if (
      trimmedName.length >= 1 &&
      trimmedName.length <= MAX_NICKNAME_LENGTH &&
      trimmedName !== player.nickname
    ) {
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
      className={`flex items-center gap-3 px-3 py-2.5 border-b border-surface-highest/40 last:border-0 transition-all ${!player.isAlive ? "opacity-40" : ""}`}
    >
      {/* Avatar — Polaroid style */}
      <div
        className={`w-8 h-8 flex-shrink-0 border overflow-hidden ${
          player.isYou
            ? "border-primary/60"
            : player.isHost
              ? "border-primary/30"
              : "border-surface-highest"
        } ${isChoosingCharacter || hasNicknameNoCharacter ? "animate-pulse" : ""}`}
      >
        {player.character && player.character.avatarUrl && !imgError ? (
          <img
            src={player.character.avatarUrl}
            alt={player.character.namePl}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={handleImgError}
          />
        ) : (
          <div className="w-full h-full bg-surface-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px] text-on-surface/30">
              {isChoosingCharacter || hasNicknameNoCharacter
                ? "hourglass_top"
                : player.isHost
                  ? "star"
                  : "person"}
            </span>
          </div>
        )}
      </div>

      {/* Name + character */}
      <div className="flex-1 min-w-0">
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
              className="bg-transparent border-b border-primary text-on-surface text-sm font-display max-w-[120px] focus:outline-none"
              placeholder="Nazwa gracza"
              maxLength={MAX_NICKNAME_LENGTH}
              autoFocus
            />
            <button onClick={handleSaveRename} className="text-primary hover:opacity-70">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </button>
            <button onClick={handleCancelEdit} className="text-on-surface/30 hover:opacity-70">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              {isChoosingCharacter ? (
                <span className="font-display text-xs text-on-surface/30 uppercase tracking-widest animate-pulse">
                  Wybiera postać...
                </span>
              ) : (
                <>
                  <span
                    className={`font-display font-black text-sm uppercase tracking-wide truncate ${player.isYou ? "text-on-surface" : "text-on-surface/70"}`}
                  >
                    {player.nickname}
                  </span>
                  {player.isYou && (
                    <span className="font-display text-[9px] text-primary uppercase tracking-widest">
                      (Ty)
                    </span>
                  )}
                  {isMafiaTeammate && (
                    <span
                      className="material-symbols-outlined text-[12px] text-primary-dark"
                      title="Mafia"
                    >
                      group
                    </span>
                  )}
                </>
              )}
            </div>
            {player.character && (
              <span className="font-display text-[10px] text-on-surface/30 uppercase tracking-widest">
                {player.character.namePl}
              </span>
            )}
            {!player.isAlive && (
              <span className="font-display text-[10px] text-on-surface/30 uppercase tracking-widest">
                Wyeliminowany
              </span>
            )}
          </div>
        )}
      </div>

      {/* Investigation result */}
      {investigated === true && (
        <span className="material-symbols-outlined text-[16px] text-primary-dark" title="Mafia">
          close
        </span>
      )}
      {investigated === false && (
        <span className="material-symbols-outlined text-[16px] text-green-400" title="Niewinny">
          check
        </span>
      )}

      {/* Role badge (GM or finished) */}
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

      {/* Rename button for own player in lobby */}
      {isLobby && player.isYou && !isEditing && !isHost && (
        <button
          onClick={() => setIsEditing(true)}
          className="size-7 flex items-center justify-center text-on-surface/20 hover:text-on-surface/50 transition-colors"
          title="Zmień pseudonim"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
        </button>
      )}

      {/* Kick button (host only, in lobby) */}
      {isLobby && isHost && !player.isHost && onKick && (
        <button
          onClick={() => onKick(player.playerId)}
          className="size-7 flex items-center justify-center text-on-surface/20 hover:text-primary-dark transition-colors"
          title="Usuń gracza"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}
    </div>
  );
}

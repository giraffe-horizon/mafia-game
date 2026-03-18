"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { PublicPlayer } from "@/lib/db";

function roleBadgeClass(role: string) {
  if (role === "mafia") return "text-red-400 border-red-900/50 bg-red-950/30";
  if (role === "detective") return "text-blue-400 border-blue-900/50 bg-blue-950/30";
  if (role === "doctor") return "text-green-400 border-green-900/50 bg-green-950/30";
  return "text-slate-400 border-slate-700 bg-slate-900/30";
}

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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState(player.nickname);

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

  // Player states for choosing character
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
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${player.isYou ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800 bg-black/20"} ${!player.isAlive ? "opacity-40" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center border ${
          player.isHost ? "border-primary/50 bg-primary/10" : "border-slate-700 bg-slate-800"
        } ${isChoosingCharacter || hasNicknameNoCharacter ? "animate-pulse" : ""}`}
      >
        {player.character ? (
          <>
            {player.character.avatarUrl ? (
              <>
                <img
                  src={player.character.avatarUrl}
                  alt={player.character.namePl}
                  className="w-9 h-9 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const placeholder =
                      target.parentElement?.querySelector(".character-placeholder");
                    if (placeholder) (placeholder as HTMLElement).style.display = "flex";
                  }}
                />
                <div className="character-placeholder hidden w-9 h-9 rounded-full bg-primary/20 text-primary font-bold items-center justify-center text-sm">
                  {player.character.namePl.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                {player.character.namePl.charAt(0).toUpperCase()}
              </div>
            )}
          </>
        ) : (
          <span className="material-symbols-outlined text-[18px] text-slate-400">
            {isChoosingCharacter || hasNicknameNoCharacter
              ? "hourglass_top"
              : player.isHost
                ? "manage_accounts"
                : "person"}
          </span>
        )}
      </div>
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
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white max-w-[120px]"
                placeholder="Nazwa gracza"
                maxLength={20}
                autoFocus
              />
              <button
                onClick={handleSaveRename}
                className="text-green-400 hover:text-green-300 transition-colors"
                title="Zapisz"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-300 transition-colors"
                title="Anuluj"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  {isChoosingCharacter ? (
                    <span className="text-sm font-medium text-slate-400 italic animate-pulse">
                      Wybiera postać...
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-white truncate">
                        {player.nickname}
                      </span>
                      {player.isYou && (
                        <span className="text-xs text-emerald-400/70 font-typewriter">(Ty)</span>
                      )}
                    </>
                  )}
                </div>
                {player.character && (
                  <span className="text-[11px] text-slate-500 font-typewriter">
                    {player.character.namePl}
                  </span>
                )}
              </div>
            </>
          )}
          {isMafiaTeammate && (
            <span className="text-xs" title="Członek mafii">
              🔴
            </span>
          )}
        </div>
        {!player.isAlive && (
          <span className="text-xs text-slate-600 font-typewriter uppercase">Wyeliminowany</span>
        )}
      </div>
      {showRoleBadge && player.role && (
        <span
          className={`text-xs font-typewriter font-bold uppercase px-2 py-1 rounded border ${roleBadgeClass(player.role)}`}
        >
          {ROLE_LABELS[player.role]}
        </span>
      )}
      {isFinished && !isHost && player.role && !isChoosingCharacter && (
        <span
          className={`text-xs font-typewriter font-bold uppercase px-2 py-1 rounded border ${roleBadgeClass(player.role)}`}
        >
          {ROLE_LABELS[player.role]}
        </span>
      )}
      {isLobby && isHost && !player.isHost && onKick && (
        <button
          onClick={() => onKick(player.playerId)}
          className="size-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition-all"
          title="Usuń gracza"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}

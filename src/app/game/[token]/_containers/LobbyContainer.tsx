"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/app/game/[token]/_stores/gameStore";
import { usePlayerState } from "@/app/game/[token]/_hooks/usePlayerState";
import LobbyView from "@/app/game/[token]/_components/LobbyView";
import { COPY_FEEDBACK_MS } from "@/lib/constants";

export default function LobbyContainer() {
  const { isHost, nonHostPlayers } = usePlayerState();
  const state = useGameStore((s) => s.state);
  const starting = useGameStore((s) => s.starting);
  const startGame = useGameStore((s) => s.startGame);
  const transferGameMaster = useGameStore((s) => s.transferGameMaster);

  const [copied, setCopied] = useState(false);
  const [mafiaCount, setMafiaCount] = useState(0);
  const [gameMode, setGameMode] = useState<"full" | "simple">("full");

  const lobbySettings = state?.lobbySettings;
  useEffect(() => {
    if (lobbySettings) {
      setGameMode(lobbySettings.mode);
      setMafiaCount(lobbySettings.mafiaCount);
    }
  }, [lobbySettings]);

  if (!state) return null;

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?code=${state.game.code}`;

  function copyCode() {
    navigator.clipboard.writeText(state!.game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }

  return (
    <LobbyView
      isHost={isHost}
      gameCode={state.game.code}
      joinUrl={joinUrl}
      copied={copied}
      copyCode={copyCode}
      setCopied={setCopied}
      nonHostPlayers={nonHostPlayers}
      gameMode={gameMode}
      setGameMode={setGameMode}
      mafiaCount={mafiaCount}
      setMafiaCount={setMafiaCount}
      starting={starting}
      onStart={() => startGame(gameMode, mafiaCount)}
      onTransferGm={(playerId: string) => transferGameMaster(playerId)}
    />
  );
}

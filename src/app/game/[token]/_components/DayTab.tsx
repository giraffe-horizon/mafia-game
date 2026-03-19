"use client";

import { useState } from "react";
import { useGameStore } from "../_stores/gameStore";
import LobbyView from "./LobbyView";
import DeadSpectatorView from "./DeadSpectatorView";
import PlayersList from "./PlayersList";
import { SectionHeader, Card, InfoCard } from "@/components/ui";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";

interface DayTabProps {
  token: string;
  joinUrl: string;
  copied: boolean;
  copyCode: () => void;
  setCopied: (v: boolean) => void;
  gameMode: "full" | "simple";
  setGameMode: (m: "full" | "simple") => void;
  mafiaCount: number;
  setMafiaCount: (n: number) => void;
  starting: boolean;
  onStart: () => void;
  onKick: (playerId: string) => void;
  onTransferGm: (playerId: string) => void;
}

export default function DayTab({
  token,
  joinUrl,
  copied,
  copyCode,
  setCopied,
  gameMode,
  setGameMode,
  mafiaCount,
  setMafiaCount,
  starting,
  onStart,
  onKick,
  onTransferGm,
}: DayTabProps) {
  const [roleVisible, setRoleVisible] = useState(false);
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const { game, currentPlayer, players } = state;
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const isFinished = game.status === "finished";
  const phase = game.phase;
  const nonHostPlayers = players.filter((p) => !p.isHost);

  // Lobby: full lobby view
  if (isLobby) {
    return (
      <>
        <LobbyView
          isHost={isHost}
          gameCode={game.code}
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
          onStart={onStart}
          onTransferGm={onTransferGm}
          token={token}
          round={game.round}
        />
        <PlayersList
          players={players}
          isPlaying={false}
          isFinished={false}
          isLobby={true}
          isHost={isHost}
          currentPlayerRole={currentPlayer.role || undefined}
          roleVisible={false}
          onKick={onKick}
        />
      </>
    );
  }

  // Night phase: "trwa noc" + player list (roles hidden)
  if (phase === "night") {
    return (
      <>
        <InfoCard
          icon="bedtime"
          title="Trwa noc — gracze wykonują akcje"
          description="Poczekaj na zakończenie nocy"
          className="mx-5 mt-5"
        />
        <PlayersList
          players={players}
          isPlaying={true}
          isFinished={false}
          isLobby={false}
          isHost={isHost}
          currentPlayerRole={undefined}
          roleVisible={false}
          onKick={onKick}
        />
      </>
    );
  }

  // Voting phase
  if (phase === "voting") {
    return (
      <>
        <InfoCard
          icon="how_to_vote"
          title="Trwa głosowanie"
          description="Przejdź do zakładki GŁOSY aby oddać głos"
          className="mx-5 mt-5"
        />
        <PlayersList
          players={players}
          isPlaying={true}
          isFinished={false}
          isLobby={false}
          isHost={isHost}
          currentPlayerRole={currentPlayer.role || undefined}
          roleVisible={false}
          onKick={onKick}
        />
      </>
    );
  }

  // Review phase
  if (phase === "review") {
    return (
      <>
        <div className="mx-5 mt-5 p-4 border border-on-surface/10 bg-surface-low flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface/40">
            {PHASE_ICONS[phase]}
          </span>
          <div>
            <p className="text-on-surface/30 font-display font-bold uppercase tracking-widest text-[10px]">
              Faza gry
            </p>
            <p className="font-display font-bold uppercase tracking-wider text-on-surface">
              {PHASE_LABELS[phase]}
            </p>
          </div>
        </div>
        <PlayersList
          players={players}
          isPlaying={true}
          isFinished={false}
          isLobby={false}
          isHost={isHost}
          currentPlayerRole={currentPlayer.role || undefined}
          roleVisible={isHost}
          onKick={onKick}
        />
      </>
    );
  }

  // Finished
  if (isFinished) {
    return (
      <PlayersList
        players={players}
        isPlaying={false}
        isFinished={true}
        isLobby={false}
        isHost={isHost}
        currentPlayerRole={currentPlayer.role || undefined}
        roleVisible={true}
        onKick={onKick}
      />
    );
  }

  // Day phase
  return (
    <>
      {/* Role card for non-host alive players */}
      {!isHost && currentPlayer.isAlive && (
        <div className="mx-5 mt-5">
          <SectionHeader className="pl-1">Twoja rola</SectionHeader>
          <Card
            variant="highlighted"
            onClick={() => setRoleVisible((v) => !v)}
            className="w-full p-5 cursor-pointer active:scale-[0.98]"
            role="button"
            tabIndex={0}
            aria-label={roleVisible ? "Ukryj rolę" : "Pokaż rolę"}
          >
            {roleVisible ? (
              <div className="flex items-center gap-4">
                <span
                  className={`material-symbols-outlined text-[48px] ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                >
                  {ROLE_ICONS[currentPlayer.role ?? "civilian"]}
                </span>
                <div className="text-left">
                  <p
                    className={`font-display text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[currentPlayer.role ?? "civilian"]}`}
                  >
                    {ROLE_LABELS[currentPlayer.role ?? "civilian"]}
                  </p>
                  {currentPlayer.role === "mafia" && (
                    <p className="text-stamp/70 text-xs font-display mt-1">
                      Twoi wspólnicy są oznaczeni na liście
                    </p>
                  )}
                  <p className="text-on-surface/40 text-sm mt-1">Stuknij aby ukryć</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2">
                <span className="material-symbols-outlined text-[32px] text-on-surface/20">
                  visibility_off
                </span>
                <p className="font-display text-on-surface/40 uppercase tracking-widest text-sm">
                  Stuknij aby zobaczyć rolę
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Detective result */}
      {!isHost && roleVisible && currentPlayer.role === "detective" && state.detectiveResult && (
        <div className="mx-5 mt-4">
          <SectionHeader icon="search">Wynik śledztwa</SectionHeader>
          <Card
            className={`p-4 ${state.detectiveResult.isMafia ? "bg-stamp/10 border-stamp/30" : "bg-green-900/20 border-green-700/30"}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-[32px] ${state.detectiveResult.isMafia ? "text-stamp" : "text-green-400"}`}
              >
                search
              </span>
              <p className="font-display font-bold tracking-wide text-on-surface">
                {state.detectiveResult.isMafia
                  ? `${state.detectiveResult.targetNickname} — MAFIA`
                  : `${state.detectiveResult.targetNickname} — niewinny`}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Day discussion info */}
      {!isHost && currentPlayer.isAlive && (
        <InfoCard
          icon="wb_sunny"
          title="Dzień — dyskutujcie i szukajcie mafii"
          className="mx-5 mt-4"
        />
      )}

      {/* Dead spectator */}
      {!isHost && !currentPlayer.isAlive && (
        <DeadSpectatorView
          currentPlayer={{ role: currentPlayer.role || undefined }}
          players={players}
        />
      )}

      {/* Host phase indicator */}
      {isHost && (
        <div className="mx-5 mt-5 p-4 border border-on-surface/10 bg-surface-low flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface/40">
            {PHASE_ICONS[phase]}
          </span>
          <div>
            <p className="text-on-surface/30 font-display font-bold uppercase tracking-widest text-[10px]">
              Faza gry
            </p>
            <p className="font-display font-bold uppercase tracking-wider text-on-surface">
              {PHASE_LABELS[phase]}
            </p>
          </div>
        </div>
      )}

      {/* Player list */}
      <PlayersList
        players={players}
        isPlaying={true}
        isFinished={false}
        isLobby={false}
        isHost={isHost}
        currentPlayerRole={currentPlayer.role || undefined}
        roleVisible={roleVisible}
        investigatedPlayers={state.investigatedPlayers}
        onKick={onKick}
      />
    </>
  );
}

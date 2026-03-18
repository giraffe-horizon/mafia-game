"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import type { PublicPlayer } from "@/lib/db";
import { ROLE_LABELS, ROLE_COLORS, PHASE_LABELS, PHASE_ICONS, ROLE_ICONS } from "@/lib/constants";
import * as apiClient from "@/lib/api-client";
import CharacterPicker from "@/components/CharacterPicker";
import OnboardingScreen from "./_components/OnboardingScreen";
import PlayerRow from "./_components/PlayerRow";
import GMPanel from "./_components/gm/GMPanel";
import EndScreen from "./_components/EndScreen";
import ToastOverlay from "./_components/ToastOverlay";
import GameHeader from "./_components/GameHeader";
import LobbyView from "./_components/LobbyView";
import NightView from "./_components/NightView";
import DayView from "./_components/DayView";
import VotingView from "./_components/VotingView";
import SettingsModal from "./_components/SettingsModal";
import NightActionPanel from "./_components/NightActionPanel";
import VotePanel from "./_components/VotePanel";
import LobbyTransferGm from "./_components/LobbyTransferGm";
import ReviewView from "./_components/ReviewView";
import PlayersList from "./_components/PlayersList";
import MissionsList from "./_components/MissionsList";
import { useGamePolling } from "./_hooks/useGamePolling";
import { useGameActions } from "./_hooks/useGameActions";
import { useOnboarding } from "./_hooks/useOnboarding";
import { useMessageForm } from "./_hooks/useMessageForm";
import { useMissionForm } from "./_hooks/useMissionForm";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function GameClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  // Custom hooks
  const { state, error, setError, toasts, dismissToast, refetch, characters } =
    useGamePolling(token);
  const {
    actionPending,
    actionError,
    phasePending,
    starting,
    changingDecision,
    setChangingDecision,
    handleAction,
    handlePhase,
    handleStart,
    handleKick,
    handleLeave,
    handleRematch,
    handleGmAction,
    handleTransferGm,
  } = useGameActions({ token, refetch, setError });
  const {
    onboardingNickname,
    selectedCharacterId,
    onboardingLoading,
    onboardingError,
    setOnboardingNickname,
    setSelectedCharacterId,
    setOnboardingError,
    handleSetup,
    handleCharacterUpdate,
  } = useOnboarding({ token, refetch });
  const {
    msgTarget,
    msgContent,
    msgPending,
    msgError,
    setMsgTarget,
    setMsgContent,
    setMsgError,
    handleSendMessage,
  } = useMessageForm({ token, refetch });
  const {
    msnTarget,
    msnDesc,
    msnSecret,
    msnPoints,
    msnPreset,
    msnPending,
    msnError,
    setMsnTarget,
    setMsnDesc,
    setMsnSecret,
    setMsnPoints,
    setMsnPreset,
    setMsnError,
    handleCreateMission,
    handleCompleteMission,
    handleDeleteMission,
  } = useMissionForm({ token, refetch });

  // UI state (remains in component)
  const [roleVisible, setRoleVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mafiaCount, setMafiaCount] = useState(0);
  const [gameMode, setGameMode] = useState<"full" | "simple">("full");
  const [rematchPending, setRematchPending] = useState(false);
  const [mafiaCountSetting, setMafiaCountSetting] = useState(0);
  const [mgTab, setMgTab] = useState<"game" | "message" | "mission" | "settings">("game");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Reset changingDecision when phase changes (must be before conditional returns!)
  const currentPhase = state?.game?.phase;
  const currentRound = state?.game?.round;
  useEffect(() => {
    setChangingDecision(false);
  }, [currentPhase, currentRound]);

  useEffect(() => {
    if (state?.currentPlayer?.character) {
      setSelectedCharacterId(state.currentPlayer.character.id);
    }
  }, [state?.currentPlayer?.character, setSelectedCharacterId]);

  useEffect(() => {
    if (!showSettingsModal) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSettingsModal]);

  // UI helper functions
  const handleOnboardingSetup = () => handleSetup();
  const handleCharacterUpdateWrapper = () => handleCharacterUpdate(setShowSettingsModal);
  const handleRematchWrapper = () => {
    setRematchPending(true);
    handleRematch(mafiaCountSetting).finally(() => setRematchPending(false));
  };
  const handleStartWrapper = () => handleStart(gameMode, mafiaCount);

  function copyCode() {
    if (!state) return;
    navigator.clipboard.writeText(state.game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // Loading / Error screens
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
        <p className="text-slate-300 font-typewriter text-lg text-center px-8">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 text-primary font-typewriter uppercase tracking-widest text-sm hover:text-primary/80 transition-colors"
        >
          ← Powrót
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">
          refresh
        </span>
        <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
          Ładowanie...
        </p>
      </div>
    );
  }

  // Onboarding screen
  if (!state.currentPlayer.isSetupComplete && !state.currentPlayer.isHost) {
    return (
      <OnboardingScreen
        gameCode={state.game.code}
        characters={characters}
        onboardingNickname={onboardingNickname}
        selectedCharacterId={selectedCharacterId}
        onboardingLoading={onboardingLoading}
        onboardingError={onboardingError}
        takenCharacterIds={state.takenCharacterIds}
        onNicknameChange={setOnboardingNickname}
        onCharacterSelect={setSelectedCharacterId}
        onSubmit={handleOnboardingSetup}
      />
    );
  }

  const { game, currentPlayer, players, missions, detectiveResult } = state;
  const isHost = currentPlayer.isHost;
  const isLobby = game.status === "lobby";
  const isPlaying = game.status === "playing";
  const isFinished = game.status === "finished";
  const phase = game.phase;
  const myAction = changingDecision ? null : state.myAction;
  const actionTargets = players.filter(
    (p) =>
      p.isAlive &&
      !p.isYou &&
      !p.isHost &&
      !(roleVisible && currentPlayer.role === "mafia" && p.role === "mafia")
  );
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?code=${game.code}`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-dark overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <ToastOverlay toasts={toasts} onDismiss={dismissToast} />

      <GameHeader
        token={token}
        phase={phase}
        round={game.round}
        isHost={isHost}
        currentPlayer={currentPlayer}
        onShowSettings={() => setShowSettingsModal(true)}
      />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-6">
        {/* ── LOBBY ── */}
        {isLobby && (
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
            onStart={handleStartWrapper}
            onTransferGm={handleTransferGm}
          />
        )}

        {/* ── NIGHT ── */}
        {isPlaying && phase === "night" && (
          <NightView
            isHost={isHost}
            currentPlayer={{
              isAlive: currentPlayer.isAlive,
              role: currentPlayer.role || undefined,
            }}
            roleVisible={roleVisible}
            setRoleVisible={setRoleVisible}
            actionTargets={actionTargets}
            myAction={myAction}
            actionPending={actionPending}
            actionError={actionError}
            changingDecision={changingDecision}
            setChangingDecision={setChangingDecision}
            onAction={(type, targetId) => {
              setChangingDecision(false);
              handleAction(type, targetId);
            }}
            mafiaTeamActions={state.mafiaTeamActions}
            currentNickname={currentPlayer.nickname}
            players={players}
          />
        )}

        {/* ── DAY ── */}
        {isPlaying && phase === "day" && (
          <DayView
            isHost={isHost}
            currentPlayer={{
              isAlive: currentPlayer.isAlive,
              role: currentPlayer.role || undefined,
            }}
            roleVisible={roleVisible}
            setRoleVisible={setRoleVisible}
            detectiveResult={detectiveResult || undefined}
            phase={phase}
          />
        )}

        {/* ── VOTING ── */}
        {isPlaying && phase === "voting" && (
          <VotingView
            isHost={isHost}
            currentPlayer={{
              isAlive: currentPlayer.isAlive,
              role: currentPlayer.role || undefined,
            }}
            roleVisible={roleVisible}
            setRoleVisible={setRoleVisible}
            phase={phase}
            players={players}
            myAction={myAction}
            actionPending={actionPending}
            actionError={actionError}
            changingDecision={changingDecision}
            setChangingDecision={setChangingDecision}
            onVote={(targetId) => {
              setChangingDecision(false);
              handleAction("vote", targetId);
            }}
            voteTally={state.voteTally}
          />
        )}

        {/* ── Missions (non-host) ── */}
        {!isHost && <MissionsList missions={missions} showPoints={state.showPoints} />}

        {/* ── REVIEW ── */}
        {isPlaying && phase === "review" && (
          <ReviewView
            isHost={isHost}
            token={token}
            showPoints={state.showPoints}
            hostMissions={state.hostMissions}
            onComplete={handleCompleteMission}
            onDelete={handleDeleteMission}
            onRefetch={refetch}
          />
        )}

        {/* ── FINISHED ── */}
        {isFinished && (
          <EndScreen
            game={game}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            rematchPending={rematchPending}
            onRematch={handleRematchWrapper}
            hostMissions={state.hostMissions}
            mafiaCountSetting={mafiaCountSetting}
          />
        )}

        {/* ── MG panel ── */}
        {isPlaying && isHost && (
          <GMPanel
            phase={phase}
            players={nonHostPlayers}
            tab={mgTab}
            onTabChange={setMgTab}
            phasePending={phasePending}
            onPhase={handlePhase}
            msgTarget={msgTarget}
            msgContent={msgContent}
            msgPending={msgPending}
            msgError={msgError}
            onMsgTargetChange={setMsgTarget}
            onMsgContentChange={setMsgContent}
            onSendMessage={handleSendMessage}
            msnTarget={msnTarget}
            msnDesc={msnDesc}
            msnPoints={msnPoints}
            msnPreset={msnPreset}
            msnPending={msnPending}
            msnError={msnError}
            onMsnTargetChange={setMsnTarget}
            onMsnDescChange={setMsnDesc}
            onMsnPointsChange={setMsnPoints}
            onMsnPresetChange={setMsnPreset}
            onCreateMission={handleCreateMission}
            hostMissions={state.hostMissions}
            onCompleteMission={handleCompleteMission}
            onDeleteMission={handleDeleteMission}
            hostActions={state.hostActions}
            phaseProgress={state.phaseProgress}
            onGmAction={handleGmAction}
            onTransferGm={handleTransferGm}
            mafiaCountSetting={mafiaCountSetting}
            onMafiaCountSettingChange={setMafiaCountSetting}
          />
        )}

        {/* ── Players list ── */}
        <PlayersList
          players={players}
          isPlaying={isPlaying}
          isFinished={isFinished}
          isLobby={isLobby}
          isHost={isHost}
          currentPlayerRole={currentPlayer.role || undefined}
          roleVisible={roleVisible}
          onKick={handleKick}
        />
      </div>

      <SettingsModal
        isVisible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        playerNickname={state?.currentPlayer?.nickname || ""}
        currentPlayer={{
          isHost: currentPlayer.isHost,
          character: currentPlayer.character ? { id: currentPlayer.character.id } : undefined,
        }}
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        onCharacterSelect={setSelectedCharacterId}
        onSave={handleCharacterUpdateWrapper}
        onLeaveGame={() => {
          setShowSettingsModal(false);
          handleLeave();
        }}
      />
    </div>
  );
}

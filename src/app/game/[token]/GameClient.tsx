"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ActionType, GamePhase, GameStateResponse } from "@/db";
import OnboardingScreen, {
  type FormData,
  type CharacterSelection,
  type LoadingState,
} from "./_components/OnboardingScreen";
import GMPanel from "./_components/gm/GMPanel";
import EndScreen from "./_components/EndScreen";
import ToastOverlay from "./_components/ToastOverlay";
import GameHeader from "./_components/GameHeader";
import LobbyView from "./_components/LobbyView";
import NightView, {
  type PlayerState as NightPlayerState,
  type NightViewState,
  type NightActionData,
} from "./_components/NightView";
import DayView from "./_components/DayView";
import VotingView, {
  type PlayerState as VotingPlayerState,
  type VotingViewState,
  type VoteState,
} from "./_components/VotingView";
import SettingsModal from "./_components/SettingsModal";
import type { ActionState, MafiaState } from "./_components/NightActionPanel";
import ReviewView from "./_components/ReviewView";
import PlayersList from "./_components/PlayersList";
import MissionsList from "./_components/MissionsList";
import type { MessageFormProps, MissionFormProps } from "./types";
import { useOnboarding } from "./_hooks/useOnboarding";
import { useMessageForm } from "./_hooks/useMessageForm";
import { useMissionForm } from "./_hooks/useMissionForm";
import { useGameStore } from "./_stores/gameStore";
import { createHttpGameService, type GameService } from "./_services/gameService";
import { PageLayout } from "@/components/ui";

// Stateless service — safe to create at module level
const gameService: GameService = createHttpGameService();

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function GameClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  // Zustand store
  const state = useGameStore((s) => s.state);
  const error = useGameStore((s) => s.error);
  const characters = useGameStore((s) => s.characters);
  const actionPending = useGameStore((s) => s.actionPending);
  const actionError = useGameStore((s) => s.actionError);
  const phasePending = useGameStore((s) => s.phasePending);
  const starting = useGameStore((s) => s.starting);
  const changingDecision = useGameStore((s) => s.changingDecision);

  // Store actions
  const refetch = useGameStore((s) => s.refetch);
  const setChangingDecision = useGameStore((s) => s.setChangingDecision);
  const submitAction = useGameStore((s) => s.submitAction);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const startGame = useGameStore((s) => s.startGame);
  const kickPlayer = useGameStore((s) => s.kickPlayer);
  const leaveGame = useGameStore((s) => s.leaveGame);
  const transferGameMaster = useGameStore((s) => s.transferGameMaster);
  const submitGmAction = useGameStore((s) => s.submitGmAction);

  // Store initialization
  const initialize = useGameStore((s) => s.initialize);

  const {
    onboardingNickname,
    selectedCharacterId,
    onboardingLoading,
    onboardingError,
    setOnboardingNickname,
    setSelectedCharacterId,
    handleSetup,
    handleCharacterUpdate,
  } = useOnboarding({ token, refetch, gameService });
  const {
    msgTarget,
    msgContent,
    msgPending,
    msgError,
    setMsgTarget,
    setMsgContent,
    handleSendMessage,
  } = useMessageForm({ token, refetch, gameService });
  const {
    msnTarget,
    msnDesc,
    msnPoints,
    msnPreset,
    msnPending,
    msnError,
    setMsnTarget,
    setMsnDesc,
    setMsnPoints,
    setMsnPreset,
    handleCreateMission,
    handleCompleteMission,
    handleDeleteMission,
  } = useMissionForm({ token, refetch, gameService });

  // UI state (remains in component)
  const [roleVisible, setRoleVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mafiaCount, setMafiaCount] = useState(0);
  const [gameMode, setGameMode] = useState<"full" | "simple">("full");
  const [mafiaCountSetting, setMafiaCountSetting] = useState(0);
  const [mgTab, setMgTab] = useState<"game" | "message" | "mission" | "settings">("game");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Initialize store with token and service
  useEffect(() => {
    if (token) {
      initialize(token, gameService);
    }
    return () => {
      useGameStore.getState().stopPolling();
    };
  }, [token, initialize]);

  // Reset changingDecision when phase changes (must be before conditional returns!)
  const currentPhase = state?.game?.phase;
  const currentRound = state?.game?.round;
  useEffect(() => {
    setChangingDecision(false);
  }, [currentPhase, currentRound, setChangingDecision]);

  const handleAction = async (actionType: ActionType, targetPlayerId: string) => {
    await submitAction(actionType, targetPlayerId);
  };

  const handlePhase = async (newPhase: GamePhase) => {
    await advancePhase(newPhase);
  };

  const handleStart = async (gameMode: "full" | "simple", mafiaCount: number) => {
    await startGame(gameMode, mafiaCount);
  };

  const handleKick = async (playerId: string) => {
    await kickPlayer(playerId);
  };

  const handleLeave = async () => {
    if (!confirm("Czy na pewno chcesz opuścić grę?")) return;
    const result = await leaveGame();
    if (result.success) {
      router.push("/");
    }
  };

  const handleGmAction = async (
    forPlayerId: string,
    actionType: ActionType,
    targetPlayerId: string
  ) => {
    await submitGmAction(forPlayerId, actionType, targetPlayerId);
  };

  const handleTransferGm = async (newHostPlayerId: string) => {
    await transferGameMaster(newHostPlayerId);
  };

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
  const handleStartWrapper = () => handleStart(gameMode, mafiaCount);

  function copyCode() {
    if (!state) return;
    navigator.clipboard.writeText(state.game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // Grouped props for prop drilling reduction
  // ---------------------------------------------------------------------------
  const messageForm: MessageFormProps = {
    msgTarget,
    msgContent,
    msgPending,
    msgError,
    onMsgTargetChange: setMsgTarget,
    onMsgContentChange: setMsgContent,
    onSendMessage: handleSendMessage,
  };

  const missionForm: MissionFormProps & {
    hostMissions?: GameStateResponse["hostMissions"];
    onCompleteMission: (id: string) => void;
    onDeleteMission: (id: string) => void;
  } = {
    msnTarget,
    msnDesc,
    msnPoints,
    msnPreset,
    msnPending,
    msnError,
    onMsnTargetChange: setMsnTarget,
    onMsnDescChange: setMsnDesc,
    onMsnPointsChange: setMsnPoints,
    onMsnPresetChange: setMsnPreset,
    onCreateMission: handleCreateMission,
    hostMissions: state?.hostMissions,
    onCompleteMission: handleCompleteMission,
    onDeleteMission: handleDeleteMission,
  };

  // ---------------------------------------------------------------------------
  // Loading / Error screens
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-[48px] text-primary mb-4">error</span>
        <p className="text-slate-300 font-typewriter text-lg text-center px-8">{error}</p>
        <Link
          href="/"
          className="mt-6 text-primary font-typewriter uppercase tracking-widest text-sm hover:text-primary/80 transition-colors"
        >
          ← Powrót
        </Link>
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
    const formData: FormData = {
      onboardingNickname,
      onNicknameChange: setOnboardingNickname,
    };

    const characterSelection: CharacterSelection = {
      characters,
      selectedCharacterId,
      onCharacterSelect: setSelectedCharacterId,
      takenCharacterIds: state.takenCharacterIds,
    };

    const loadingState: LoadingState = {
      onboardingLoading,
      onboardingError,
    };

    return (
      <OnboardingScreen
        gameCode={state.game.code}
        formData={formData}
        characterSelection={characterSelection}
        loadingState={loadingState}
        onSubmit={handleOnboardingSetup}
      />
    );
  }

  const { game, currentPlayer, players, missions } = state;
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
    <PageLayout>
      <ToastOverlay />

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
        {isPlaying &&
          phase === "night" &&
          (() => {
            const playerState: NightPlayerState = {
              isAlive: currentPlayer.isAlive,
              role: currentPlayer.role || undefined,
            };

            const viewState: NightViewState = {
              roleVisible,
              setRoleVisible,
            };

            const actionState: ActionState = {
              pending: actionPending,
              error: actionError,
              onAction: (type, targetId) => {
                setChangingDecision(false);
                handleAction(type, targetId);
              },
              onChangeDecision: () => setChangingDecision(true),
            };

            const mafiaState: MafiaState = {
              teamActions: state.mafiaTeamActions,
              currentNickname: currentPlayer.nickname,
            };

            const actionData: NightActionData = {
              actionTargets,
              myAction,
              actionState,
              mafiaState,
            };

            return (
              <NightView
                isHost={isHost}
                currentPlayer={playerState}
                viewState={viewState}
                actionData={actionData}
                players={players}
              />
            );
          })()}

        {/* ── DAY ── */}
        {isPlaying && phase === "day" && (
          <DayView roleVisible={roleVisible} setRoleVisible={setRoleVisible} />
        )}

        {/* ── VOTING ── */}
        {isPlaying &&
          phase === "voting" &&
          (() => {
            const currentPlayerState: VotingPlayerState = {
              isAlive: currentPlayer.isAlive,
              role: currentPlayer.role || undefined,
            };

            const viewState: VotingViewState = {
              roleVisible,
              setRoleVisible,
              phase,
            };

            const voteState: VoteState = {
              players,
              myAction,
              actionPending,
              actionError,
              changingDecision,
              setChangingDecision,
              onVote: (targetId) => {
                setChangingDecision(false);
                handleAction("vote", targetId);
              },
              voteTally: state.voteTally,
            };

            return (
              <VotingView
                isHost={isHost}
                currentPlayer={currentPlayerState}
                viewState={viewState}
                voteState={voteState}
              />
            );
          })()}

        {/* ── Missions (non-host) ── */}
        {!isHost && <MissionsList missions={missions} showPoints={state.showPoints} />}

        {/* ── REVIEW ── */}
        {isPlaying && phase === "review" && (
          <ReviewView
            isHost={isHost}
            showPoints={state.showPoints}
            hostMissions={state.hostMissions}
            onComplete={handleCompleteMission}
            onDelete={handleDeleteMission}
          />
        )}

        {/* ── FINISHED ── */}
        {isFinished && <EndScreen />}

        {/* ── MG panel ── */}
        {isPlaying && isHost && (
          <GMPanel
            phase={phase}
            players={nonHostPlayers}
            tab={mgTab}
            onTabChange={setMgTab}
            phasePending={phasePending}
            onPhase={handlePhase}
            messageForm={messageForm}
            missionForm={missionForm}
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
        playerInfo={{
          playerNickname: state?.currentPlayer?.nickname || "",
          currentPlayer: {
            isHost: currentPlayer.isHost,
            character: currentPlayer.character ? { id: currentPlayer.character.id } : undefined,
          },
        }}
        characterData={{
          characters,
          selectedCharacterId,
          onCharacterSelect: setSelectedCharacterId,
        }}
        modalActions={{
          onSave: handleCharacterUpdateWrapper,
          onLeaveGame: () => {
            setShowSettingsModal(false);
            handleLeave();
          },
        }}
      />
    </PageLayout>
  );
}

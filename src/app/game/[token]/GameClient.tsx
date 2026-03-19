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
import NightTab from "./_components/NightTab";
import DayTab from "./_components/DayTab";
import VotesTab from "./_components/VotesTab";
import LogsTab from "./_components/LogsTab";
import ReviewView from "./_components/ReviewView";
import SettingsModal from "./_components/SettingsModal";
import RankingModal from "./_components/RankingModal";
import type { ActionState, MafiaState } from "./_components/NightActionPanel";
import type { MessageFormProps, MissionFormProps } from "./types";
import { useOnboarding } from "./_hooks/useOnboarding";
import { useMessageForm } from "./_hooks/useMessageForm";
import { useMissionForm } from "./_hooks/useMissionForm";
import { useGameStore } from "./_stores/gameStore";
import { createHttpGameService, type GameService } from "./_services/gameService";
import { PageLayout, TabBar, type Tab } from "@/components/ui";

// Stateless service — safe to create at module level
const gameService: GameService = createHttpGameService();

const GAME_TABS: Tab[] = [
  { id: "night", icon: "bedtime", label: "NOC" },
  { id: "day", icon: "wb_sunny", label: "DZIEŃ" },
  { id: "votes", icon: "how_to_vote", label: "GŁOSY" },
  { id: "logs", icon: "history", label: "LOGI" },
];

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
  const activeTab = useGameStore((s) => s.activeTab);

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
  const setActiveTab = useGameStore((s) => s.setActiveTab);

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

  // UI state
  const [copied, setCopied] = useState(false);
  const [mafiaCount, setMafiaCount] = useState(0);
  const [gameMode, setGameMode] = useState<"full" | "simple">("full");
  const [mafiaCountSetting, setMafiaCountSetting] = useState(0);
  const [mgTab, setMgTab] = useState<"game" | "message" | "mission" | "settings">("game");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showGMPanel, setShowGMPanel] = useState(false);

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

  // Sync lobby settings from server
  const lobbySettings = state?.lobbySettings;
  useEffect(() => {
    if (lobbySettings) {
      setGameMode(lobbySettings.mode);
      setMafiaCount(lobbySettings.mafiaCount);
    }
  }, [lobbySettings]);

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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAction = async (actionType: ActionType, targetPlayerId: string) => {
    await submitAction(actionType, targetPlayerId);
  };

  const handlePhase = async (newPhase: GamePhase) => {
    await advancePhase(newPhase);
  };

  const handleStart = async (gm: "full" | "simple", mc: number) => {
    await startGame(gm, mc);
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
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-stamp mb-4">error</span>
        <p className="text-on-surface font-display text-lg text-center px-8">{error}</p>
        <Link href="/" className="mt-6 text-stamp font-display uppercase tracking-widest text-sm">
          ← Powrót
        </Link>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[40px] text-stamp animate-spin mb-4">
          refresh
        </span>
        <p className="text-on-surface/40 font-display uppercase tracking-widest text-sm">
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
        onSubmit={() => handleSetup()}
      />
    );
  }

  const { game, currentPlayer, players } = state;
  const isHost = currentPlayer.isHost;
  const isPlaying = game.status === "playing";
  const isFinished = game.status === "finished";
  const phase = game.phase;
  const myAction = changingDecision ? null : state.myAction;
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?code=${game.code}`;

  // ---------------------------------------------------------------------------
  // Grouped props
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageLayout>
      <ToastOverlay />

      <GameHeader
        phase={phase}
        round={game.round}
        gameCode={game.code}
        isHost={isHost}
        currentPlayer={currentPlayer}
        onShowSettings={() => setShowSettingsModal(true)}
        onShowRanking={() => setShowRanking(true)}
        onShowGMPanel={() => setShowGMPanel(true)}
      />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-20">
        {/* Tab content */}
        {activeTab === "night" && (
          <NightTab
            actionState={actionState}
            mafiaState={mafiaState}
            myAction={myAction}
            onKick={handleKick}
          />
        )}

        {activeTab === "day" && (
          <DayTab
            token={token}
            joinUrl={joinUrl}
            copied={copied}
            copyCode={copyCode}
            setCopied={setCopied}
            gameMode={gameMode}
            setGameMode={setGameMode}
            mafiaCount={mafiaCount}
            setMafiaCount={setMafiaCount}
            starting={starting}
            onStart={() => handleStart(gameMode, mafiaCount)}
            onKick={handleKick}
            onTransferGm={handleTransferGm}
          />
        )}

        {activeTab === "votes" && (
          <VotesTab
            myAction={myAction}
            actionPending={actionPending}
            actionError={actionError}
            onVote={(targetId) => {
              setChangingDecision(false);
              handleAction("vote", targetId);
            }}
            onChangeDecision={() => setChangingDecision(true)}
          />
        )}

        {activeTab === "logs" && <LogsTab token={token} />}

        {/* Review phase overlay (shown above tabs, all players) */}
        {isPlaying && phase === "review" && (
          <ReviewView
            isHost={isHost}
            showPoints={state.showPoints}
            hostMissions={state.hostMissions}
            onComplete={handleCompleteMission}
            onDelete={handleDeleteMission}
          />
        )}

        {/* End screen */}
        {isFinished && activeTab === "day" && <EndScreen />}
      </div>

      {/* Fixed bottom tab bar */}
      <TabBar
        tabs={GAME_TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as typeof activeTab)}
        position="bottom"
      />

      {/* GM Panel overlay */}
      {isHost && showGMPanel && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95">
          <div className="flex items-center justify-between px-4 py-3 border-b border-on-surface/10">
            <p className="font-display font-bold uppercase tracking-widest text-sm text-on-surface">
              Panel Mistrza Gry
            </p>
            <button
              onClick={() => setShowGMPanel(false)}
              className="size-9 flex items-center justify-center text-on-surface/50 hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isPlaying && (
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
            {!isPlaying && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="material-symbols-outlined text-[36px] text-on-surface/20">
                  manage_accounts
                </span>
                <p className="text-on-surface/30 font-display uppercase tracking-widest text-xs">
                  Panel MG dostępny podczas gry
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} token={token} />

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
          onSave: () => handleCharacterUpdate(setShowSettingsModal),
          onLeaveGame: () => {
            setShowSettingsModal(false);
            handleLeave();
          },
        }}
      />
    </PageLayout>
  );
}

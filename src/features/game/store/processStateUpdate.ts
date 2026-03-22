import type { GameStateResponse } from "@/db";
import type { GameState } from "@/features/game/store/gameStore";
import { buildTransition } from "@/features/game/store/buildTransition";

const TOAST_DURATION = 7000;
const MISSION_TOAST_DURATION = 10000;

/**
 * Shared state-comparison logic used by both polling (refetch) and WebSocket
 * state updates. Handles:
 * - Phase transition overlays
 * - Auto-switch active tab on phase change
 * - Tab notification badges
 * - Message toasts
 * - Mission toasts + badges
 * - Role visibility reset on round change
 */
export function processStateUpdate(
  newData: GameStateResponse,
  get: () => GameState,
  set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void
) {
  const prevState = get().state;
  const prevPhase = prevState?.game?.phase;
  const newPhase = newData.game?.phase;
  const phaseChanged = prevPhase != null && newPhase != null && prevPhase !== newPhase;

  // Set transition BEFORE updating state so the overlay blocks the view
  if (phaseChanged) {
    const transition = buildTransition(
      prevPhase,
      newPhase,
      newData.game.round,
      newData.lastPhaseResult,
      newData.game.winner
    );
    if (transition) {
      set({ transition });
    }

    // Auto-switch active tab on phase change
    // GM doesn't have night tab — fall back to day
    const isHost = newData.currentPlayer?.isHost ?? false;
    if (newPhase === "night") get().setActiveTab(isHost ? "day" : "night");
    else if (newPhase === "day") get().setActiveTab("day");
    else if (newPhase === "voting") get().setActiveTab("day");
    // review/ended: stay on current tab

    // Set notification badges for inactive tabs when phase changes
    const currentTab = get().activeTab;
    if (newPhase === "day" && currentTab !== "night") {
      get().incrementTabNotification("night");
    }
    if (newPhase === "voting" && currentTab !== "day") {
      get().incrementTabNotification("day");
    }
  }

  const prevRound = prevState?.game?.round;
  const newRound = newData.game?.round;
  const roundChanged = prevRound !== undefined && newRound !== undefined && prevRound !== newRound;

  set({
    state: newData,
    ...(roundChanged ? { roleVisible: false } : {}),
  });

  // Suppress toasts during phase transitions — the transition screens
  // already convey kill/vote results
  const { _shownMessageIds } = get();
  if (!phaseChanged) {
    const currentToasts = get().toasts;
    const newToasts = [...currentToasts];

    for (const msg of newData.messages) {
      if (!_shownMessageIds.has(msg.id)) {
        _shownMessageIds.add(msg.id);
        const newToast = { id: msg.id, content: msg.content };
        newToasts.push(newToast);

        // Set notification badge for "agents" tab if new message appears
        const currentTab = get().activeTab;
        if (currentTab !== "agents" && !msg.eventType) {
          get().incrementTabNotification("agents");
        }

        const timeoutId = setTimeout(() => {
          get()._toastTimeouts.delete(msg.id);
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== msg.id),
          }));
        }, TOAST_DURATION);
        get()._toastTimeouts.set(msg.id, timeoutId);
      }
    }

    if (newToasts.length > currentToasts.length) {
      set({ toasts: newToasts });
    }
  } else {
    // Mark messages as shown so they don't appear as toasts later
    for (const msg of newData.messages) {
      _shownMessageIds.add(msg.id);
    }
  }

  // Detect new missions and show toast + badge
  const { _shownMissionIds } = get();
  for (const mission of newData.missions) {
    if (!_shownMissionIds.has(mission.id)) {
      _shownMissionIds.add(mission.id);

      // Only show toast if this is not the first fetch (state was already loaded)
      if (prevPhase != null) {
        const missionToast = {
          id: `mission-${mission.id}`,
          content: `Nowa misja: ${mission.description}`,
          icon: "task",
          action: { label: "Zobacz →", tab: "agents" },
          variant: "mission" as const,
        };
        set((s) => ({ toasts: [...s.toasts, missionToast] }));

        const timeoutId = setTimeout(() => {
          get()._toastTimeouts.delete(missionToast.id);
          set((s) => ({
            toasts: s.toasts.filter((t) => t.id !== missionToast.id),
          }));
        }, MISSION_TOAST_DURATION);
        get()._toastTimeouts.set(missionToast.id, timeoutId);

        // Badge on "Agenci" tab
        const currentTab = get().activeTab;
        if (currentTab !== "agents") {
          get().incrementTabNotification("agents");
        }
      }
    }
  }
}

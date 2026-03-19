# Refactoring Plan — Mafia Game Client Architecture

## Current State Summary

| File | Lines | Problem |
|------|-------|---------|
| `GameClient.tsx` | 622 | God component: routing, state derivation, prop drilling, event handlers, UI composition |
| `gameStore.ts` | 540 | Monolithic store: core state + 14 actions + polling + toasts + ranking in one file |
| `NightView.tsx` | 112 | Receives pre-shaped props, duplicates RoleCard UI |
| `VotingView.tsx` | 179 | Duplicates RoleCard + PhaseIndicator, mixes vote filtering logic |
| `DayView.tsx` | 133 | Duplicates RoleCard + PhaseIndicator, reads store directly (inconsistent) |
| `LobbyView.tsx` | 187 | 14 props drilled from GameClient |
| `NightPhaseSection` | inline in GameClient | 56-line wrapper that reshapes props for NightView |
| `VotingPhaseSection` | inline in GameClient | 50-line wrapper that reshapes props for VotingView |
| `ReviewView.tsx` | 99 | Calls `finalizeGame` from store directly (inconsistent with prop-based siblings) |
| `EndScreen.tsx` | 193 | Reads store directly (inconsistent pattern) |

### Duplicated Code
- **RoleCard** — identical 40-line block in NightView, VotingView, DayView (3x)
- **PhaseIndicator** — identical 12-line block in VotingView, DayView (2x)
- **ActionConfirmation** — near-identical in NightActionPanel + VotePanel (2x)
- **DeadSpectatorView** conditional — same guard in NightView, VotingView, DayView (3x)
- **Error message extraction** — `error instanceof Error ? error.message : "..."` repeated 8+ times

### Inconsistent Patterns
- DayView, EndScreen, ReviewView read store directly; NightView and VotingView receive everything via props
- NightPhaseSection/VotingPhaseSection exist only to reshape props — pure overhead
- `roleVisible`/`setRoleVisible` managed in GameClient but only used by phase views
- Form hooks return 8-12 values each, all threaded through GameClient to GMPanel

---

## Target Architecture

```
GameClient.tsx (~150 lines)
├── Init + polling lifecycle
├── Phase router (switch on phase)
├── Shared chrome (GameHeader, ToastOverlay, Modals)
└── Phase containers (each ~80-120 lines)
    ├── LobbyContainer    → LobbyView (pure)
    ├── NightContainer    → NightView (pure)
    ├── DayContainer      → DayView (pure)
    ├── VotingContainer   → VotingView (pure)
    ├── ReviewContainer   → ReviewView (pure)
    ├── EndContainer      → EndScreen (pure)
    └── GMPanelContainer  → GMPanel (pure)

Zustand Store (sliced)
├── gameSlice     — core GameStateResponse, polling, refetch
├── actionsSlice  — submitAction, advancePhase, startGame, kick, leave, transfer, gmAction
├── uiSlice       — toasts, changingDecision, actionPending/Error, phasePending, starting
└── scoringSlice  — ranking, roundScores, fetchRanking, fetchRoundScores

Shared Components
├── RoleCard          — extracted from 3 views
├── PhaseIndicator    — extracted from 2 views
├── ActionConfirmation — extracted from NightActionPanel + VotePanel
└── DeadOverlay       — wraps DeadSpectatorView conditional

Custom Hooks (derived state)
├── useCurrentPhase   — phase, isLobby, isPlaying, isFinished from store
├── useRoleVisibility — roleVisible + setRoleVisible + reset-on-round logic
├── useActionTargets  — filtered targets list from store
└── usePlayerState    — isHost, currentPlayer, players from store
```

---

## Phase 1 — Extract Shared UI Components

**Goal:** Eliminate all duplicated UI code without changing data flow. Pure extraction refactor.

### Files to create

| File | Description |
|------|-------------|
| `src/app/game/[token]/_components/RoleCard.tsx` (~45 lines) | Toggleable role reveal card. Props: `role: string`, `roleVisible: boolean`, `onToggle: () => void`. Extracted from NightView:47-91, VotingView:58-102, DayView:23-67 |
| `src/app/game/[token]/_components/PhaseIndicator.tsx` (~20 lines) | Host-only phase badge. Props: `phase: string`. Extracted from VotingView:105-117, DayView:70-82 |
| `src/app/game/[token]/_components/ActionConfirmation.tsx` (~30 lines) | Green confirmation box with "change decision" button. Props: `label: string`, `targetName: string`, `onChangeDecision: () => void`, `children?: ReactNode`. Extracted from NightActionPanel:96-119, VotePanel:25-41 |

### Files to modify

| File | Change |
|------|--------|
| `NightView.tsx` | Replace inline role card with `<RoleCard>` |
| `VotingView.tsx` | Replace inline role card with `<RoleCard>`, phase indicator with `<PhaseIndicator>` |
| `DayView.tsx` | Replace inline role card with `<RoleCard>`, phase indicator with `<PhaseIndicator>` |
| `NightActionPanel.tsx` | Replace action confirmation block with `<ActionConfirmation>` |
| `VotePanel.tsx` | Replace action confirmation block with `<ActionConfirmation>` |

### Files to delete
None.

### Migration strategy
1. Create the three components with the exact same markup (copy-paste, then parameterize)
2. Replace usage in one view at a time, verify visually after each
3. Run `pnpm typecheck && pnpm lint && pnpm vitest run` after all replacements

### Estimated complexity: **S**

---

## Phase 2 — Extract Derived-State Hooks

**Goal:** Move state derivation logic out of GameClient into reusable hooks. This is the foundation for Phase 3 containers.

### Files to create

| File | Description |
|------|-------------|
| `src/app/game/[token]/_hooks/useCurrentPhase.ts` (~20 lines) | Returns `{ phase, isLobby, isPlaying, isFinished, round }` from store. Replaces manual destructuring in GameClient:448-451 |
| `src/app/game/[token]/_hooks/useRoleVisibility.ts` (~20 lines) | Manages `roleVisible` state + auto-reset on round change. Absorbs GameClient:254,276-283 |
| `src/app/game/[token]/_hooks/useActionTargets.ts` (~20 lines) | Returns filtered action targets list. Absorbs GameClient:453-459. Depends on `roleVisible` from `useRoleVisibility` |
| `src/app/game/[token]/_hooks/usePlayerState.ts` (~15 lines) | Returns `{ isHost, currentPlayer, players, nonHostPlayers }` from store. Absorbs GameClient:447,460 |
| `src/lib/errors.ts` (~5 lines) | `getErrorMessage(error: unknown): string` utility. Replaces 8+ inline ternaries across store and hooks |

### Files to modify

| File | Change |
|------|--------|
| `GameClient.tsx` | Replace inline derivations with hook calls. Shrinks by ~30 lines |
| `gameStore.ts` | Replace inline `error instanceof Error ? ...` with `getErrorMessage()` |
| `useOnboarding.ts` | Use `getErrorMessage()` |
| `useMessageForm.ts` | Use `getErrorMessage()` |
| `useMissionForm.ts` | Use `getErrorMessage()` |

### Files to delete
None.

### Migration strategy
1. Create `errors.ts` utility first (no dependencies)
2. Create hooks one at a time, each reading from existing store
3. Replace usages in GameClient incrementally
4. Hooks are additive — old code keeps working until replaced

### Estimated complexity: **S**

---

## Phase 3 — Phase Containers (Container/Presentational Split)

**Goal:** Each game phase gets a Container component that connects to the store and passes minimal props to a pure Presentational view. GameClient becomes a thin router.

### Files to create

| File | Description |
|------|-------------|
| `src/app/game/[token]/_containers/NightContainer.tsx` (~60 lines) | Reads store via hooks (`usePlayerState`, `useRoleVisibility`, `useActionTargets`). Derives `actionState`, `mafiaState`. Renders `<NightView>`. Absorbs NightPhaseSection from GameClient |
| `src/app/game/[token]/_containers/VotingContainer.tsx` (~60 lines) | Reads store for vote state, tally. Filters vote targets. Renders `<VotingView>`. Absorbs VotingPhaseSection from GameClient |
| `src/app/game/[token]/_containers/DayContainer.tsx` (~25 lines) | Thin — just passes `useRoleVisibility` to DayView. DayView already reads store for detective result etc. |
| `src/app/game/[token]/_containers/LobbyContainer.tsx` (~70 lines) | Manages lobby-specific UI state (copied, gameMode, mafiaCount). Syncs lobbySettings from store. Renders `<LobbyView>` with minimal props. Absorbs GameClient:256-257,322-328,344-349,482-498 |
| `src/app/game/[token]/_containers/ReviewContainer.tsx` (~20 lines) | Reads `hostMissions`, `showPoints` from store. Passes to `<ReviewView>` |
| `src/app/game/[token]/_containers/EndContainer.tsx` (~10 lines) | Wrapper — EndScreen already reads store. Container just mounts it |
| `src/app/game/[token]/_containers/GMPanelContainer.tsx` (~80 lines) | Manages GM tab state, instantiates form hooks (`useMessageForm`, `useMissionForm`). Passes grouped props to `<GMPanel>`. Absorbs GameClient:229-251,258-259,354-383,560-578 |
| `src/app/game/[token]/_containers/PlayersListContainer.tsx` (~30 lines) | Reads `players`, `isHost`, `roleVisible`, `investigatedPlayers` from store/hooks. Renders `<PlayersList>` |

### Files to modify

| File | Change |
|------|--------|
| `GameClient.tsx` | **Major reduction.** Remove: NightPhaseSection (lines 49-119), VotingPhaseSection (lines 121-185), all form hook calls, all handler functions, all grouped props construction, all lobby state. Replace phase rendering blocks with container imports. Target: ~150 lines |
| `NightView.tsx` | Props interface stays the same — container provides them |
| `VotingView.tsx` | Props interface stays the same — container provides them |
| `DayView.tsx` | Stop reading store directly. Accept `detectiveResult`, `currentPlayer`, `players` via props from DayContainer. Makes it a pure presentational component |
| `ReviewView.tsx` | Stop calling `useGameStore(s => s.finalizeGame)` directly. Accept `onFinalize` as prop from ReviewContainer |
| `LobbyView.tsx` | Reduce props — container handles `copied`/`copyCode`/`setCopied` internally, passes only what LobbyView needs for rendering |

### Files to delete

| File | Reason |
|------|--------|
| None deleted, but NightPhaseSection + VotingPhaseSection inline functions removed from GameClient.tsx | Logic moves to NightContainer and VotingContainer |

### Migration strategy
1. Create `_containers/` directory
2. Start with the simplest: `DayContainer` and `ReviewContainer` — verify pattern works
3. Then `NightContainer` (absorbs NightPhaseSection) and `VotingContainer` (absorbs VotingPhaseSection)
4. Then `LobbyContainer` (absorbs most lobby state from GameClient)
5. Then `GMPanelContainer` (absorbs form hooks + GM state)
6. Finally `PlayersListContainer` and `EndContainer`
7. After each container, update GameClient to use it and verify tests pass
8. Last step: delete dead code from GameClient

### Target GameClient.tsx structure after Phase 3:
```tsx
export default function GameClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { phase, isLobby, isPlaying, isFinished } = useCurrentPhase();
  const state = useGameStore((s) => s.state);
  const error = useGameStore((s) => s.error);
  const initialize = useGameStore((s) => s.initialize);

  // Init + cleanup
  useEffect(() => { ... }, [token, initialize]);

  // Reset changingDecision on phase change
  useEffect(() => { ... }, [phase, round]);

  // Error / loading screens
  if (error) return <ErrorScreen error={error} />;
  if (!state) return <LoadingScreen />;
  if (!state.currentPlayer.isSetupComplete && !state.currentPlayer.isHost)
    return <OnboardingContainer />;

  return (
    <PageLayout>
      <ToastOverlay />
      <GameHeader ... />
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-6">
        {isLobby && <LobbyContainer />}
        {isPlaying && phase === "night" && <NightContainer />}
        {isPlaying && phase === "day" && <DayContainer />}
        {isPlaying && phase === "voting" && <VotingContainer />}
        {isPlaying && phase === "review" && <ReviewContainer />}
        {isFinished && <EndContainer />}
        {isPlaying && state.currentPlayer.isHost && <GMPanelContainer />}
        <MissionsList ... />
        <PlayersListContainer />
      </div>
      <RankingModal ... />
      <SettingsModal ... />
    </PageLayout>
  );
}
```

### Estimated complexity: **L**

---

## Phase 4 — Store Slicing

**Goal:** Split monolithic 540-line gameStore into focused slices. Each slice is independently testable.

### Files to create

| File | Description |
|------|-------------|
| `src/app/game/[token]/_stores/slices/gameSlice.ts` (~120 lines) | Core state: `GameStateResponse`, `error`, `characters`. Actions: `initialize`, `refetch`, `setError`. Polling logic: `startPolling`, `stopPolling`, `_scheduleNext`, visibility handler |
| `src/app/game/[token]/_stores/slices/actionsSlice.ts` (~150 lines) | Game mutations: `submitAction`, `advancePhase`, `startGame`, `kickPlayer`, `leaveGame`, `rematchGame`, `transferGameMaster`, `submitGmAction`, `finalizeGame`. All call refetch after success |
| `src/app/game/[token]/_stores/slices/uiSlice.ts` (~60 lines) | Loading flags: `actionPending`, `actionError`, `phasePending`, `starting`, `changingDecision`. Toast management: `toasts[]`, `dismissToast`, `_shownMessageIds`, `_toastTimeouts` |
| `src/app/game/[token]/_stores/slices/scoringSlice.ts` (~40 lines) | `ranking`, `rankingMeta`, `roundScores`, `fetchRanking`, `fetchRoundScores` |

### Files to modify

| File | Change |
|------|--------|
| `gameStore.ts` | Rewrite to compose slices: `create<GameState>((...a) => ({ ...gameSlice(...a), ...actionsSlice(...a), ...uiSlice(...a), ...scoringSlice(...a) }))`. Keep `GameState` interface + `useGameStore` export unchanged — **zero breaking changes** for consumers |

### Files to delete
None (gameStore.ts is rewritten in-place).

### Migration strategy
1. Create `slices/` directory
2. Extract scoring slice first (smallest, no dependencies on other slices)
3. Extract UI slice (toast logic needs careful handling of timeouts)
4. Extract actions slice (depends on `_gameService`, `_token`, and `refetch`)
5. Extract game slice last (owns polling + refetch, referenced by actions)
6. Use Zustand's slice pattern: each slice receives `(set, get)` and returns its portion of state
7. Verify the combined store has the exact same interface — all existing `useGameStore(s => s.xxx)` calls unchanged

### Key constraint
Slices need cross-slice access (actions call `refetch`, `refetch` updates `state`). Use `get()` to access the full store from within any slice. This is standard Zustand slice pattern.

### Estimated complexity: **M**

---

## Phase 5 — Type Consolidation

**Goal:** Single source of truth for all client-side game types. Eliminate scattered inline interfaces.

### Files to create

| File | Description |
|------|-------------|
| `src/app/game/[token]/_types/index.ts` (~80 lines) | Consolidates: `ActionState`, `MafiaState` (from NightActionPanel), `PlayerState` (from NightView + VotingView — currently duplicated with same name), `VoteTally` (from VotingView inline), `HostMission` (from ReviewView inline), `Toast` (from gameStore). Re-exports relevant types from `@/db/types` |

### Files to modify

| File | Change |
|------|--------|
| `NightActionPanel.tsx` | Import `ActionState`, `MafiaState` from `_types/` instead of defining inline |
| `NightView.tsx` | Import `PlayerState`, `NightViewState`, `NightActionData` from `_types/` |
| `VotingView.tsx` | Import `PlayerState`, `VotingViewState`, `VoteState`, `VoteTally` from `_types/` |
| `ReviewView.tsx` | Import `HostMission` from `_types/` instead of defining inline |
| `gameStore.ts` | Import `Toast` from `_types/` |
| `types.ts` (game/[token]) | Merge into `_types/index.ts`. Redirect exports for backward compat if needed |

### Files to delete

| File | Reason |
|------|--------|
| `src/app/game/[token]/types.ts` | Merged into `_types/index.ts` |

### Migration strategy
1. Create `_types/index.ts` with all types copied from their sources
2. Update imports file by file
3. Remove inline type definitions only after all imports updated
4. Run typecheck after each file change

### Estimated complexity: **S**

---

## Phase 6 — Cleanup and Polish

**Goal:** Remove dead code, ensure consistency, verify all targets met.

### Tasks

1. **Verify no component exceeds 150 lines** — if any do, extract sub-components
2. **Verify GameClient.tsx is under 200 lines** — if not, extract more to containers
3. **Verify zero prop drilling for game state** — all game state flows through store → hook → container → presentational props
4. **Consistency audit** — all phase views should follow the same pattern:
   - Container reads store via hooks
   - Presentational component receives typed props, no store access
   - Shared UI via extracted components (RoleCard, PhaseIndicator, etc.)
5. **Remove unused imports and exports** across all modified files
6. **Update barrel exports** if `_containers/` or `_types/` need them

### Files to modify
Varies based on outcomes of Phases 1-5.

### Files to delete
Any dead wrapper types or re-exports that became unnecessary.

### Estimated complexity: **S**

---

## Execution Order & Dependencies

```
Phase 1 (Shared UI)
  │
  ├── Phase 2 (Hooks) ── can run in parallel with Phase 1
  │
  └── Phase 3 (Containers) ── depends on Phase 1 + Phase 2
        │
        ├── Phase 4 (Store Slicing) ── can run in parallel with Phase 3
        │
        └── Phase 5 (Types) ── depends on Phase 3 (final prop interfaces)
              │
              └── Phase 6 (Cleanup) ── depends on all above
```

**Minimum path:** 1 → 2 → 3 → 5 → 6 (skip Phase 4 if store size is acceptable at 540 lines)

**Recommended path:** 1 → 2 → 3 → 4 + 5 (parallel) → 6

---

## Validation Checklist (after each phase)

- [ ] `pnpm typecheck` passes (zero errors)
- [ ] `pnpm lint` passes
- [ ] `pnpm vitest run` passes (all tests green)
- [ ] `pnpm build` succeeds
- [ ] No `any` types introduced
- [ ] No new `console.log` statements
- [ ] GameClient.tsx line count decreased (track per phase)
- [ ] No functional regressions (manual smoke test: lobby → night → day → voting → review → end → rematch)

---

## Line Count Targets

| File | Before | After |
|------|--------|-------|
| `GameClient.tsx` | 622 | ~150 |
| `gameStore.ts` | 540 | ~60 (composition file) + 4 slices ~370 total |
| `NightView.tsx` | 112 | ~60 (RoleCard extracted) |
| `VotingView.tsx` | 179 | ~100 (RoleCard + PhaseIndicator extracted) |
| `DayView.tsx` | 133 | ~70 (RoleCard + PhaseIndicator extracted, pure) |
| `LobbyView.tsx` | 187 | ~150 (less props, same UI) |
| New containers (8) | 0 | ~350 total |
| New shared components (3) | 0 | ~95 total |
| New hooks (4) | 0 | ~75 total |
| New types file | 0 | ~80 |
| **Net lines** | ~2,173 | ~1,410 (from core files) + ~600 (new files) = ~2,010 |

Total line count stays similar, but complexity is distributed across focused, single-responsibility files.

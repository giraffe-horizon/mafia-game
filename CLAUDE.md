# CLAUDE.md — Mafia Game Development Instructions

## Project Overview
Real-time Mafia party game helper. GM manages from phone, players join via code/QR.
- **Stack:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, Zustand 5, Zod 4
- **Deploy:** Cloudflare Workers via @opennextjs/cloudflare, D1 database
- **CI:** GitHub Actions — lint, typecheck, tests, security audit, build, staging auto-deploy

## Architecture — Mandatory Patterns

### Data Flow (DO NOT BREAK)
```
UI Components → Zustand Store → GameService → API Client → API Routes → DB Queries
```
- **Zustand store** (`features/game/store/gameStore.ts`) is the SINGLE source of truth for game state
- **GameService** (`features/game/service.ts`) abstracts transport — all game operations go through it (never call `apiClient` directly from components or store)
- **API Client** (`lib/api-client.ts`) — typed fetch wrappers, used ONLY by GameService
- **API Routes** use `withApiHandler()` wrapper (`lib/api/handler.ts`) + Zod validation (`lib/api/schemas.ts`) — never raw `getCloudflareContext()`
- **DB Queries** in `src/db/queries/` — separated by domain (game, player, actions, phase, missions, messages, characters, ranking)

### File Structure
```
src/
├── app/
│   ├── api/
│   │   └── game/[token]/      # Route handlers
│   ├── game/[token]/
│   │   ├── GameClient.tsx     # Orchestrator (~450 lines max)
│   │   └── page.tsx
│   └── ranking/               # Legacy page (ranking is now a modal)
├── features/
│   └── game/                  # Feature-first: all game code lives here
│       ├── components/
│       │   ├── shared/        # RoleCard, PhaseIndicator, ActionConfirmation, etc.
│       │   ├── phases/        # NightView, DayView, VotingView, ReviewView
│       │   ├── lobby/         # LobbyView, LobbyTransferGm, OnboardingScreen
│       │   ├── players/       # PlayersList, PlayerRow, MissionsList
│       │   ├── modals/        # RankingModal, SettingsModal
│       │   ├── gm/            # GMPanel, GMGameTab, GMMessageTab, etc.
│       │   ├── EndScreen.tsx, GameHeader.tsx, NightActionPanel.tsx, VotePanel.tsx
│       │   └── index.ts
│       ├── containers/        # Smart containers (DayContainer, NightContainer, etc.)
│       ├── hooks/             # useOnboarding, usePlayerState, useCurrentPhase, etc.
│       ├── store/             # Zustand gameStore + slices/
│       ├── service.ts         # GameService (transport abstraction)
│       ├── types.ts           # Game-specific UI types
│       └── index.ts           # Barrel for the feature
├── components/
│   ├── ui/                    # Reusable primitives (Button, Card, Badge, Modal, etc.)
│   └── HomeClient.tsx         # Home page client component
├── config/
│   ├── server.ts              # ServerConfig — async, server-only (never import in client components)
│   ├── client.ts              # ClientConfig — async, called in layout.tsx, passed via React Context
│   ├── ConfigContext.tsx       # ClientConfigProvider + useClientConfig() hook
│   └── index.ts               # Barrel re-export
├── db/
│   ├── queries/               # 8 domain modules (game, player, actions, phase, etc.)
│   ├── types.ts               # All DB + API types
│   ├── helpers.ts             # Utility functions (nanoid, now, generateSessionCode, buildRoles)
│   └── index.ts               # Barrel re-export
└── lib/
    ├── api/                   # API route infrastructure
    │   ├── handler.ts         # withApiHandler wrappers
    │   ├── schemas.ts         # Zod validation schemas
    │   ├── db.ts              # getDb() — D1 database accessor
    │   └── index.ts           # Barrel re-export
    ├── api-client.ts           # Typed fetch wrappers (used by GameService only)
    ├── constants.ts            # ROLE_LABELS, ROLE_COLORS, PHASE_LABELS etc.
    ├── cn.ts                   # clsx + tailwind-merge
    └── missions-presets.ts     # Predefined mission templates
```

## Coding Standards

### TypeScript
- **Strict mode** — zero `any` in production code (tests OK)
- Use **union types** not strings: `GamePhase`, `Role`, `ActionType` from `@/db/types`
- Type assertions (`as`) only when genuinely necessary — prefer type guards
- Export interfaces for all component props
- Import types with `import type { ... }` syntax

### React / Next.js
- **Server Components** by default — `"use client"` only when hooks/interactivity needed
- Every `"use client"` component using hooks (useEffect, useState, useCallback) MUST have `"use client"` directive
- `export const dynamic = "force-dynamic"` on pages that access D1
- Use `next/font/google` (not `<link>`) — Material Symbols Outlined is exception (stays as `<link>`)
- Use `next/link` for navigation — `router.push()` only for programmatic redirects after mutations
- `<img>` with `loading="lazy" decoding="async"` — `next/image` doesn't work on Cloudflare Workers
- Error boundaries: `error.tsx` at root + per-route
- Loading states: `loading.tsx` per-route

### Config System
- Both `getServerConfig()` and `getClientConfig()` are **async** (Cloudflare Workers compatibility)
- `getServerConfig()` — server-only, use in API routes and server components
- `getClientConfig()` — called in `layout.tsx` (server component), result passed to `ClientConfigProvider`
- Client components access config via `useClientConfig()` hook — never call `getClientConfig()` directly in client code
- Flow: `layout.tsx` → `await getClientConfig()` → `<ClientConfigProvider config={...}>` → `useClientConfig()`

### State Management
- **Game state** → Zustand store in `features/game/store/` (polling, toasts, actions, loading states)
- **Form state** → local custom hooks in `features/game/hooks/` (`useOnboarding`, `useMessageForm`, `useMissionForm`)
- **UI state** (modals, tabs) → local `useState` in component
- **NEVER** duplicate game state in component `useState` — read from store via selectors

### UI Components (`src/components/ui/`)
- Use `cn()` for conditional classes
- All components accept `className` prop for overrides
- Variants via props (e.g., `variant="primary"`, `size="sm"`)
- Use these instead of inline Tailwind divs:
  - `<Button>` — actions (primary/secondary/danger/ghost)
  - `<Card>` — content containers (default/highlighted/danger)
  - `<Badge>` — role/status labels
  - `<Modal>` — overlays (has ESC, backdrop click, ARIA)
  - `<SectionHeader>` — section titles with optional icon
  - `<InfoCard>` — informational cards with icon + message
  - `<FormField>` — label + input + error wrapper
  - `<Select>`, `<Input>` — form controls
  - `<ProgressBar>` — progress indicators
  - `<TabBar>` — tab navigation
  - `<GameLayout>` — full-screen game wrapper
  - `<StatusItem>` — list items with status icon
  - `<ActionBar>` — bottom action bar

### API Routes
- ALWAYS use `withApiHandler()` / `withApiHandlerNoToken()` / `withApiHandlerMission()`
- ALWAYS validate request body with Zod schema from `schemas.ts`
- NEVER expose internal error details to client — log server-side, return generic message
- NEVER use `getCloudflareContext()` directly — use `getDb()` from `lib/api/db.ts`

### DB Queries (`src/db/queries/`)
- One module per domain — keep under 400 lines
- Use `db.batch()` for atomic multi-statement operations
- Parameterized queries only — never string interpolation in SQL
- Helper functions in `db/helpers.ts`
- Types in `db/types.ts`

## Game Logic Rules

### Roles
- **Mafia** — votes to eliminate (unanimous required), sees teammates
- **Policjant** (detective) — investigates one player per night
- **Lekarz** (doctor) — protects one player per night, CANNOT protect same player two rounds in a row
- **Cywil** — observes (smoke screen action)
- **Mistrz Gry (GM)** — manages game, excluded from roles/win conditions

### Role Visibility
- Player sees own role only
- GM sees all roles
- Mafia sees mafia teammates
- Dead players see all roles
- After game ends — all roles revealed
- **NEVER leak roles to unauthorized players**

### Game Flow
```
Lobby → Start → Night → Day → Voting → [Night → Day → Voting ...] → Review → End
```
- **Rematch** resets game in-place (same tokens, same lobby, round counter continues)
- **Win conditions** checked after each elimination (night kill or vote)
- **Round results** stored in `round_results` table for cumulative ranking

### Mafia Voting
- All alive mafia must vote unanimously for elimination to happen
- If votes differ or not all voted → "Mafia nie mogła się zdecydować"
- GM sees mafia voting progress and cannot advance phase without consensus

## Commands
```bash
pnpm dev              # Local dev server
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm vitest run       # Run tests
pnpm build            # Production build (@opennextjs/cloudflare)
```

## Pre-commit Checks (automated via Husky)
- ESLint --fix
- Prettier --write

## Testing
- **Framework:** Vitest with mock D1 (SQLite via better-sqlite3)
- **Coverage:** statements/branches/lines ≥60%, functions ≥55%
- Test files in `src/__tests__/`
- Mock helpers in `src/__tests__/helpers/`
- Focus: DB query integration tests, business logic edge cases

## Design System
- **Theme:** Dark noir — bg `#1a0c0c`, primary red `#da0b0b`
- **Fonts:** Be Vietnam Pro (body), Special Elite (typewriter/labels), Material Symbols Outlined (icons)
- **Tailwind tokens:** `bg-background-dark`, `text-primary`, `font-typewriter`, `font-display`
- **Mobile-first:** `max-w-lg` container, touch targets ≥44px

## Don'ts
- ❌ Don't create files in `src/lib/db.ts` — use `src/db/` modules
- ❌ Don't import `apiClient` outside of `GameService`
- ❌ Don't use `useState` for game state — use Zustand store
- ❌ Don't put business logic in components — keep in DB queries or store actions
- ❌ Don't use `as any` — find the proper type
- ❌ Don't use `Math.random()` for security-sensitive operations
- ❌ Don't leave `console.log` in production code (only in error handlers via `console.error`)
- ❌ Don't use index as React key for dynamic lists
- ❌ Don't hardcode colors/fonts — use Tailwind tokens
- ❌ Don't skip Zod validation on API routes

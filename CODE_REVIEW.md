# Code Review — Mafia Game App

**Data:** 2026-03-19 | **Branch:** `feat/round-summary-scoring`
**Reviewer:** Claude Opus 4.6 (Principal Software Engineer)
**Scope:** Pełny przegląd `src/` — architektura, stan, separacja, czystość kodu

---

## 1. Next.js Health Check

### 1.1 RSC vs Client Components — OCENA: 7/10

| Aspekt | Status | Komentarz |
|--------|--------|-----------|
| Layout (`layout.tsx`) | ✅ Server Component | Poprawnie: `next/font/google`, Material Symbols via `<link>` |
| Home (`page.tsx`) | ✅ SC + delegacja do `HomeClient` | Poprawny wzorzec: SC wrapper → CC child |
| Game page (`game/[token]/page.tsx`) | ⚠️ Pusty wrapper | `force-dynamic` + `<GameClient />` — OK ale strona nie robi nic |
| Ranking (`ranking/page.tsx`) | ⚠️ Analogicznie | SC wrapper → `RankingClient` — mógłby fetchować dane server-side |
| Error boundary (`error.tsx`) | ⚠️ Nie używa design systemu | Inline Tailwind zamiast `<Button>`, brak integracji z error tracking |
| Loading (`game/[token]/loading.tsx`) | ✅ Istnieje | Poprawny loading state |

**Problemy krytyczne:**

1. **Brak server-side data fetching.** Strona `game/[token]/page.tsx` mogłaby wykonać initial fetch na serwerze i przekazać jako props do `GameClient`, eliminując loading spinner na starcie. Obecny flow:
   ```
   Page (SC, pusty) → GameClient (CC) → useEffect → fetch → render
   ```
   Powinno być:
   ```
   Page (SC, fetch initial state) → GameClient (CC, hydrate z danymi)
   ```

2. **`ranking/page.tsx` i `ranking/RankingClient.tsx` to legacy strona** — ranking jest teraz modalem (`RankingModal.tsx`). Te pliki to martwy kod lub powinny być usunięte.

3. **`dev/page.tsx` — brak ochrony produkcyjnej.** Sprawdzenie `process.env.NODE_ENV` w renderze nie zapobiega włączeniu route'a do buildu. Powinien być middleware lub `next.config.ts` rewrites.

### 1.2 Routing & Metadata — OCENA: 8/10

| Aspekt | Status |
|--------|--------|
| `force-dynamic` na stronach z D1 | ✅ |
| `next/link` zamiast `<a>` | ✅ (w `GameClient`, `error.tsx`) |
| `next/font/google` | ✅ Be Vietnam Pro + Special Elite |
| `<img>` z lazy/async | ✅ (w `PlayerRow`, `GameHeader`) |
| `next/image` nie używany | ✅ Zgodne z Cloudflare Workers |
| `metadata` w layoutcie | ✅ Z dynamiczną wersją z `package.json` |

### 1.3 ARCHITECTURE.md — NIEAKTUALNY

`ARCHITECTURE.md` opisuje stan sprzed refactoringu:
- Wskazuje na `src/lib/db.ts` (~1250 linii) i `src/lib/store.ts` — pliki nie istnieją
- Opisuje `GameClient.tsx` jako ~1000 linii — jest teraz ~530
- Wspomina `@cloudflare/next-on-pages` — migracja na `@opennextjs/cloudflare`
- Schemat Zustand store'a jest nieaktualny
- **Rekomendacja:** Usunąć `ARCHITECTURE.md` lub zaktualizować. `CLAUDE.md` jest źródłem prawdy.

---

## 2. Zarządzanie Stanem i Data Fetching

### 2.1 Zustand Store (`gameStore.ts`, 481 linii) — OCENA: 7/10

**Co działa dobrze:**
- Polling z exponential backoff (`_backoffDelay`, `MAX_BACKOFF = 16000`)
- Visibility API — pauza pollingu na nieaktywnej karcie
- Toast management z auto-dismiss
- `_isFetching` guard chroni przed concurrent fetches
- Czytelny interfejs `GameState` z separacją state/actions

**Problemy:**

| # | Priorytet | Problem | Lokalizacja |
|---|-----------|---------|-------------|
| S1 | 🔴 HIGH | **`apiClient` import w store** — `import * as apiClient` na linii 10, użyty do `fetchCharacters()` w `initialize()`. Łamie zasadę: "API Client used ONLY by GameService" | `gameStore.ts:10, 159` |
| S2 | 🟡 MED | **Boilerplate w akcjach** — 8 akcji (`submitAction`, `advancePhase`, `startGame`, `kickPlayer`, `leaveGame`, `rematchGame`, `transferGameMaster`, `submitGmAction`) mają identyczny wzorzec: guard → try/catch → refetch. Brak abstrakcji. | `gameStore.ts:291-471` |
| S3 | 🟡 MED | **Mutowalne `Set` i `Map` w state** — `_shownMessageIds: Set<string>` i `_toastTimeouts: Map<string, NodeJS.Timeout>` to mutowalne referencje trzymane w immutable Zustand state. Technicznie działa, ale łamie kontrakt. | `gameStore.ts:51-53` |
| S4 | 🟢 LOW | **`_scheduleNext` jako state field** — Funkcja schedulera jest w state zamiast być zamknięciem. Nienaturalny pattern ale działa. | `gameStore.ts:111` |

### 2.2 Data Flow — OCENA: 6/10

**Naruszenia architektury "UI → Store → GameService → API Client":**

| Komponent | Bezpośredni import `apiClient` | Powinno być |
|-----------|-------------------------------|-------------|
| `EndScreen.tsx` | `apiClient.fetchRoundScores()`, `apiClient.fetchRanking()` | Przez `GameService` → store action |
| `LobbyView.tsx` | `apiClient.fetchRanking()` | Przez `GameService` → store action |
| `RankingModal.tsx` | `apiClient.fetchRanking()` | Przez `GameService` → store action |
| `HomeClient.tsx` | `apiClient.createGame()`, `apiClient.joinGame()` | OK — nie jest w kontekście gry, nie ma store'a |
| `gameStore.ts` | `apiClient.fetchCharacters()` | Przez `GameService` |
| `RankingClient.tsx` | `apiClient.fetchRanking()` | Legacy — usunąć z ranking page |

**5 plików łamie mandatory data flow.** To najpoważniejszy problem architektoniczny w projekcie.

### 2.3 Polling — OCENA: 8/10

Polling jest dobrze zaimplementowany. Uwagi:
- `RankingModal.tsx` uruchamia **własny `setInterval(5000)`** do pollingu rankingu — powinien korzystać z danych store'a
- Brak ETag/If-Modified-Since w API — każdy poll zwraca pełny state

---

## 3. Separation of Concerns

### 3.1 GameClient.tsx (~530 linii) — OCENA: 7.5/10

Po refaktoryzacji z ~1000 do ~530 linii, `GameClient` nie jest już "God component", ale wciąż ma za dużo odpowiedzialności:

**Problemy:**

| # | Problem | Szczegół |
|---|---------|----------|
| C1 | **14 propsów w LobbyView** | `LobbyView` przyjmuje 14 propsów — sygnał do dalszej dekompozycji lub użycia kontekstu |
| C2 | **Wrapper functions** | `handleOnboardingSetup`, `handleStartWrapper`, `handleCharacterUpdateWrapper` — bezwartościowe wrappery, mogą być inline |
| C3 | **IIFE w JSX** | Linie 364-406 i 416-450: `(() => { ... })()` — tworzą obiekty state przy KAŻDYM renderze. Powinny być osobnymi komponentami |
| C4 | **UI state** | 9 `useState` hooków na UI state — część mogłaby być w sub-komponentach |

### 3.2 Duplikacja kodu

| Zduplikowany kod | Pliki | Linie |
|-----------------|-------|-------|
| `positionColor(i)` — kolor na podstawie pozycji w rankingu | `EndScreen.tsx:107-114`, `LobbyView.tsx:80-87`, `RankingModal.tsx` | ~21 linii × 3 |
| `RankingEntry` interface | `EndScreen.tsx:17-22`, `LobbyView.tsx:10-15` | Identyczny typ w 2 plikach |
| Logika auto-kalkulacji ilości mafii (`≤5→1, ≤8→2, ≤11→3, >11→4`) | `LobbyView.tsx:234-240`, `GMSettingsTab.tsx` | ~8 linii × 2 |
| Role reveal card (odkryj/ukryj rolę) | `DayView`, `NightView`, `VotingView` | Podobny UI w 3 komponentach |

### 3.3 DB Queries — OCENA: 9/10

Doskonała separacja — 8 modułów domenowych:

| Moduł | Linie | Status |
|-------|-------|--------|
| `game.ts` | 464 | ⚠️ Przekracza limit 400 linii |
| `phase.ts` | 388 | ✅ |
| `actions.ts` | 373 | ✅ |
| `player.ts` | 247 | ✅ |
| `ranking.ts` | 138 | ✅ |
| `missions.ts` | 94 | ✅ |
| `roundScores.ts` | 76 | ✅ |
| `messages.ts` | 44 | ✅ |
| `characters.ts` | 38 | ✅ |

- Wszystkie zapytania sparametryzowane (`.bind()`) — zero ryzyka SQL injection
- `db.batch()` dla atomowych operacji
- Typy w `types.ts`, helpery w `helpers.ts`
- `game.ts` przekracza 400 linii o 64 — kandydat do podziału (np. wydzielenie `game-config.ts`)

### 3.4 API Routes — OCENA: 9.5/10

Wzorcowa implementacja:
- **23 route'y** — wszystkie używają `withApiHandler()` / `withApiHandlerNoToken()` / `withApiHandlerMission()`
- **Zod walidacja** na wszystkich endpointach z body
- **Brak `getCloudflareContext()` bezpośrednio** — tylko przez `getDb()`
- **Brak business logic** — delegacja do `db/queries/`
- Lean files (8-24 linii każdy)

### 3.5 UI Components (`components/ui/`) — OCENA: 8/10

Solidna biblioteka primitives:
- `Button`, `Card`, `Badge`, `Modal`, `TabBar`, `FormField`, `Select`, `Input`, `ProgressBar`, `SectionHeader`, `InfoCard`, `StatusItem`, `ActionBar`, `GameLayout`, `PageLayout`, `RoleHidden`
- Barrel export w `index.ts`
- `cn()` helper z `clsx` + `tailwind-merge`

**Problem:** Nie wszystkie komponenty korzystają z tych primitives:
- `GMMessageTab.tsx` — raw `<select>`, `<textarea>`, `<button>` zamiast `<Select>`, `<Input>`, `<Button>`
- `GMGameTab.tsx` — raw `<select>` zamiast `<Select>`
- `LobbyView.tsx` — raw `<button>` w wielu miejscach zamiast `<Button>`
- `error.tsx` — raw `<button>` zamiast `<Button>`

---

## 4. Optymalizacja i Clean Code

### 4.1 Code Smells

| # | Smell | Lokalizacja | Wpływ |
|---|-------|-------------|-------|
| O1 | **Magic numbers** | `3`, `5` (min graczy), `2000` (copy timeout), `5000` (ranking poll), `20` (max nickname) — rozrzucone po komponentach | Czytelność |
| O2 | **Hardcoded emoji** w renderze | `📋`, `💀`, `⭐`, `☠`, `🔴`, `🟢`, `✅`, `⏳`, `⚠️` w ~10 plikach | Spójność |
| O3 | **Brak debounce** na akcjach | `handleSetup`, `handleCreateMission` — rapid clicks mogą wywołać duplikaty | UX bug |
| O4 | **`document.body.style.overflow`** | `GameClient.tsx:191` — bezpośrednia manipulacja DOM zamiast CSS/className | Anti-pattern |
| O5 | **`window.location.origin`** w renderze | `GameClient.tsx:319` — runtime access zamiast env var lub server-side | Hydration risk |

### 4.2 TypeScript Quality — OCENA: 8.5/10

- Zero `any` w kodzie produkcyjnym ✅
- Union types (`GamePhase`, `Role`, `ActionType`) poprawnie użyte ✅
- `import type` poprawnie stosowany ✅
- Type assertions (`as`) — 18 instancji, wszystkie uzasadnione (casting stringów z DB na union types)
- **Brak:** `as any` ✅

### 4.3 Martwy kod

| Plik | Status |
|------|--------|
| `src/app/ranking/page.tsx` + `RankingClient.tsx` | Ranking jest teraz modalem — legacy page do usunięcia |
| `ARCHITECTURE.md` | Nieaktualny — opisuje stan sprzed refactoringu |
| `EndScreen.tsx` linia 240 | Komentarz "removed, already shown in PlayersList" — wyczyścić |

### 4.4 Testy — OCENA: 5/10

| Co jest | Status |
|---------|--------|
| `db-integration.test.ts` | ✅ Obszerny, real SQLite |
| `db.test.ts` | ⚠️ Tylko negatywne ścieżki |
| `missions-presets.test.ts` | ✅ Solidny |

| Czego brakuje | Priorytet |
|---------------|-----------|
| Testy hooków (`useOnboarding`, `useMessageForm`, `useMissionForm`) | 🔴 HIGH |
| Testy `GameService` | 🔴 HIGH |
| Testy `gameStore` (polling, toast, actions) | 🟡 MED |
| Testy komponentów (render, interakcja) | 🟡 MED |

---

## 2. Proponowana Struktura Repozytorium

Obecna struktura jest **dobra** — poniżej sugerowane drobne zmiany:

```
src/
├── app/
│   ├── _components/
│   │   └── HomeClient.tsx
│   ├── api/
│   │   ├── lib/
│   │   │   ├── handler.ts
│   │   │   ├── schemas.ts
│   │   │   └── db.ts
│   │   ├── characters/route.ts
│   │   ├── dev/seed/route.ts
│   │   └── game/
│   │       ├── create/route.ts
│   │       ├── join/route.ts
│   │       └── [token]/
│   │           ├── state/route.ts
│   │           ├── start/route.ts
│   │           ├── phase/route.ts
│   │           ├── action/route.ts
│   │           ├── ...remaining routes...
│   │           └── mission/
│   │               ├── route.ts
│   │               └── [missionId]/
│   │                   ├── route.ts
│   │                   └── complete/route.ts
│   ├── game/[token]/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── GameClient.tsx
│   │   ├── _components/
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── LobbyView.tsx
│   │   │   ├── NightView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── VotingView.tsx
│   │   │   ├── ReviewView.tsx
│   │   │   ├── EndScreen.tsx
│   │   │   ├── GameHeader.tsx
│   │   │   ├── PlayerRow.tsx
│   │   │   ├── PlayersList.tsx
│   │   │   ├── RankingModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── ToastOverlay.tsx
│   │   │   ├── DeadSpectatorView.tsx
│   │   │   ├── NightActionPanel.tsx
│   │   │   ├── MafiaConsensusStatus.tsx
│   │   │   ├── MissionsList.tsx
│   │   │   ├── VotePanel.tsx
│   │   │   ├── LobbyTransferGm.tsx
│   │   │   └── gm/
│   │   │       ├── GMPanel.tsx
│   │   │       ├── GMGameTab.tsx
│   │   │       ├── GMMessageTab.tsx
│   │   │       ├── GMMissionTab.tsx
│   │   │       └── GMSettingsTab.tsx
│   │   ├── _hooks/
│   │   │   ├── useOnboarding.ts
│   │   │   ├── useMessageForm.ts
│   │   │   └── useMissionForm.ts
│   │   ├── _services/
│   │   │   └── gameService.ts
│   │   ├── _stores/
│   │   │   └── gameStore.ts
│   │   └── types.ts
│   ├── error.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│   # USUNIĘTE: ranking/ (legacy, ranking jest modalem)
│   # USUNIĘTE lub ZABLOKOWANE: dev/ (za middleware)
├── components/
│   ├── ui/
│   │   ├── index.ts              # barrel export
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── ...remaining UI...
│   │   └── PageLayout.tsx
│   ├── AppVersion.tsx
│   └── CharacterPicker.tsx
├── db/
│   ├── queries/
│   │   ├── game.ts               # ⚠️ rozdzielić jeśli >450 linii
│   │   ├── game-config.ts        # NOWY: wydzielenie z game.ts
│   │   ├── player.ts
│   │   ├── actions.ts
│   │   ├── phase.ts
│   │   ├── missions.ts
│   │   ├── messages.ts
│   │   ├── characters.ts
│   │   ├── ranking.ts
│   │   └── roundScores.ts
│   ├── types.ts
│   ├── helpers.ts
│   └── index.ts
├── lib/
│   ├── api-client.ts
│   ├── constants.ts              # + dodać MAGIC NUMBERS stąd
│   ├── cn.ts
│   ├── avatars.ts
│   └── missions-presets.ts
└── __tests__/
    ├── db.test.ts
    ├── db-integration.test.ts
    ├── missions-presets.test.ts
    ├── hooks/                     # NOWY: testy hooków
    │   ├── useOnboarding.test.ts
    │   ├── useMessageForm.test.ts
    │   └── useMissionForm.test.ts
    ├── services/                  # NOWY: testy serwisów
    │   └── gameService.test.ts
    └── helpers/
        ├── mockD1.ts
        ├── sqliteD1.ts
        └── setupStorage.ts
```

**Kluczowe zmiany:**
1. Usunięcie `ranking/` (legacy page)
2. Opcjonalne wydzielenie `game-config.ts` z `game.ts`
3. Dodanie folderów testowych: `hooks/`, `services/`
4. Przeniesienie magic numbers do `constants.ts`

---

## 3. Roadmapa Refaktoryzacji

### Faza 1 — Naruszenia Architektury (Priorytet: KRYTYCZNY)

**Krok 1.1:** Dodaj `fetchRanking` i `fetchRoundScores` do `GameService` interface + store actions.

```
Pliki do edycji:
- _services/gameService.ts (interface + implementacja — już ma te metody!)
- _stores/gameStore.ts (nowe akcje: fetchRanking, fetchRoundScores)
```

**Krok 1.2:** Usuń bezpośrednie importy `apiClient` z komponentów:
- `EndScreen.tsx` — użyj store action
- `LobbyView.tsx` — użyj store action
- `RankingModal.tsx` — użyj store action
- `gameStore.ts` — przenieś `fetchCharacters` do `GameService`

**Krok 1.3:** Usuń legacy ranking page:
- Usuń `src/app/ranking/page.tsx`
- Usuń `src/app/ranking/RankingClient.tsx`
- Zweryfikuj brak linków do `/ranking`

### Faza 2 — Eliminacja Duplikacji (Priorytet: WYSOKI)

**Krok 2.1:** Wydziel `positionColor()` do `lib/constants.ts`:

```typescript
// lib/constants.ts
export const POSITION_COLORS = ["text-amber-400", "text-slate-300", "text-orange-400", "text-slate-500"] as const;
export function positionColor(index: number): string {
  return POSITION_COLORS[index] ?? POSITION_COLORS[3];
}
```

**Krok 2.2:** Wydziel `RankingEntry` type do `db/types.ts`.

**Krok 2.3:** Wydziel magic numbers do `lib/constants.ts`:

```typescript
export const MIN_PLAYERS_FULL = 5;
export const MIN_PLAYERS_SIMPLE = 3;
export const MAX_NICKNAME_LENGTH = 20;
export const COPY_FEEDBACK_MS = 2000;
export const RANKING_POLL_MS = 5000;
```

**Krok 2.4:** Wydziel logikę auto-kalkulacji mafii:

```typescript
// lib/constants.ts
export function autoMafiaCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 11) return 3;
  return 4;
}
```

### Faza 3 — Czystość Komponentów (Priorytet: ŚREDNI)

**Krok 3.1:** Zamień IIFE w `GameClient.tsx` na komponenty:

```
GameClient.tsx linie 364-406 → wydziel do NightPhaseSection
GameClient.tsx linie 416-450 → wydziel do VotingPhaseSection
```

**Krok 3.2:** Zamień raw HTML elementy na UI primitives:
- `LobbyView.tsx` — `<button>` → `<Button>`
- `GMMessageTab.tsx` — `<select>`, `<textarea>`, `<button>` → `<Select>`, `<Input>`, `<Button>`
- `GMGameTab.tsx` — `<select>` → `<Select>`
- `error.tsx` — `<button>` → `<Button>`

**Krok 3.3:** Wydziel role reveal card do reużywalnego komponentu (używany w `DayView`, `NightView`, `VotingView`).

### Faza 4 — Testy (Priorytet: ŚREDNI)

**Krok 4.1:** Testy hooków z `@testing-library/react`:
- `useOnboarding.test.ts` — setup flow, walidacja, error handling
- `useMessageForm.test.ts` — wysyłanie, walidacja
- `useMissionForm.test.ts` — CRUD, preset handling

**Krok 4.2:** Testy `gameStore` z Vitest:
- Polling lifecycle (start/stop/visibility)
- Toast management
- Action error handling
- Backoff mechanism

**Krok 4.3:** Rozdziel `db-integration.test.ts` na pliki per-domain.

### Faza 5 — Porządki (Priorytet: NISKI)

**Krok 5.1:** Zaktualizuj lub usuń `ARCHITECTURE.md`.

**Krok 5.2:** Zabezpiecz `dev/page.tsx` — middleware sprawdzający `NODE_ENV` na poziomie route.

**Krok 5.3:** Zamień `document.body.style.overflow` na CSS class toggle.

**Krok 5.4:** Rozważ wydzielenie boilerplate'u akcji w `gameStore.ts` do helpera:

```typescript
function createStoreAction<TArgs extends unknown[], TResult>(
  fn: (service: GameService, token: string, ...args: TArgs) => Promise<TResult>,
  opts?: { loadingKey?: string; errorKey?: string; refetchOnSuccess?: boolean }
) { /* ... */ }
```

---

## 4. Przykłady Przed i Po

### Przykład 1: `EndScreen.tsx` — naruszenie architektury + duplikacja

**PRZED** (aktualny stan):

```tsx
// EndScreen.tsx — PROBLEMY:
// 1. Bezpośredni import apiClient (łamie data flow)
// 2. Zduplikowany RankingEntry interface
// 3. Zduplikowana positionColor()
// 4. useState zamiast store dla danych rankingowych
// 5. Brak obsługi race condition (unmount podczas fetch)

import * as apiClient from "@/lib/api-client";

interface RankingEntry {                        // ← zduplikowany typ (też w LobbyView)
  playerId: string;
  nickname: string;
  totalScore: number;
  roundsPlayed: number;
}

export default function EndScreen(_props: Record<string, never> = {}) {
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);  // ← powinno być w store
  const [totalRounds, setTotalRounds] = useState(0);

  useEffect(() => {
    if (!token) return;
    async function fetchScoring() {
      try {
        const [scoresData, rankingData] = await Promise.all([
          apiClient.fetchRoundScores(token!),      // ← bezpośredni apiClient!
          apiClient.fetchRanking(token!),           // ← bezpośredni apiClient!
        ]);
        // ...set state...
      } catch {
        // Scores are optional
      }
    }
    fetchScoring();
  }, [token]);

  const positionColor = (i: number) =>             // ← zduplikowana funkcja
    i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : /* ... */;

  // ...244 linii...
}
```

**PO** (rekomendowany):

```tsx
// EndScreen.tsx — POPRAWIONY:
// 1. Dane z store (nie z apiClient)
// 2. Typy importowane z @/db/types
// 3. positionColor z @/lib/constants
// 4. Brak lokalnego state na dane rankingowe

"use client";

import { useState } from "react";
import { SectionHeader, StatusItem, Button, Card } from "@/components/ui";
import { useGameStore } from "../_stores/gameStore";
import { positionColor } from "@/lib/constants";
import type { RankingEntry } from "@/db/types";  // ← importowany typ

export default function EndScreen() {
  const state = useGameStore((s) => s.state);
  const roundScores = useGameStore((s) => s.roundScores);   // ← ze store
  const ranking = useGameStore((s) => s.ranking);            // ← ze store
  const rematchGame = useGameStore((s) => s.rematchGame);
  const [rematchPending, setRematchPending] = useState(false);

  if (!state) return null;

  // ...reszta renderowania bez zmian, ale:
  // - positionColor(i) z importu
  // - brak useEffect na fetch (store robi to w initialize/refetch)
  // - brak zduplikowanych typów
}
```

**Wymagane zmiany towarzyszące:**
- `gameStore.ts`: dodać `roundScores` i `ranking` do state, fetchować w ramach `initialize()`
- `gameService.ts`: `fetchRoundScores` i `fetchRanking` już istnieją w interfejsie
- `db/types.ts`: dodać `RankingEntry` export
- `lib/constants.ts`: dodać `positionColor()`

---

### Przykład 2: `LobbyView.tsx` — prop drilling + magic numbers + raw HTML

**PRZED** (aktualny stan):

```tsx
// LobbyView.tsx — PROBLEMY:
// 1. 14 propsów (prop drilling overload)
// 2. Magic numbers: 3, 5, 2000
// 3. Raw <button> zamiast <Button>
// 4. Inline share logic (navigator.share fallback)
// 5. Auto mafia count — zduplikowana logika
// 6. Bezpośredni import apiClient

interface LobbyViewProps {
  isHost: boolean;
  gameCode: string;
  joinUrl: string;
  copied: boolean;
  copyCode: () => void;
  setCopied: (copied: boolean) => void;     // ← setter jako prop
  nonHostPlayers: PublicPlayer[];
  gameMode: "full" | "simple";
  setGameMode: (mode: "full" | "simple") => void;  // ← setter jako prop
  mafiaCount: number;
  setMafiaCount: (count: number) => void;    // ← setter jako prop
  starting: boolean;
  onStart: () => void;
  onTransferGm: (playerId: string) => void;
  token: string;
  round: number;
}

// ...
<button
  onClick={onStart}
  disabled={starting || nonHostPlayers.length < (gameMode === "simple" ? 3 : 5)}
  className="flex w-full items-center justify-center rounded-lg h-14 bg-primary ..."
>
  {starting ? "Startuję..." : "Rozpocznij grę"}
</button>

// Auto mafia count (zduplikowane):
{nonHostPlayers.length <= 5 ? 1 : nonHostPlayers.length <= 8 ? 2 : ... ? 3 : 4}
```

**PO** (rekomendowany):

```tsx
// LobbyView.tsx — POPRAWIONY:
// 1. Props zgrupowane w obiekty
// 2. Magic numbers → stałe
// 3. <Button> z design systemu
// 4. Share logic wydzielona
// 5. autoMafiaCount z constants

import { Button, SectionHeader, InfoCard } from "@/components/ui";
import { MIN_PLAYERS_FULL, MIN_PLAYERS_SIMPLE, autoMafiaCount } from "@/lib/constants";

interface LobbyViewProps {
  isHost: boolean;
  gameCode: string;
  joinUrl: string;
  lobbyActions: {                               // ← zgrupowane
    copied: boolean;
    copyCode: () => void;
    onShare: () => void;
  };
  gameConfig: {                                  // ← zgrupowane
    gameMode: "full" | "simple";
    setGameMode: (mode: "full" | "simple") => void;
    mafiaCount: number;
    setMafiaCount: (count: number) => void;
  };
  nonHostPlayers: PublicPlayer[];
  starting: boolean;
  onStart: () => void;
  onTransferGm: (playerId: string) => void;
}

// ...
const minPlayers = gameConfig.gameMode === "full" ? MIN_PLAYERS_FULL : MIN_PLAYERS_SIMPLE;

<Button
  onClick={onStart}
  disabled={starting || nonHostPlayers.length < minPlayers}
  loading={starting}
  icon="play_arrow"
  className="w-full h-14 text-lg"
>
  Rozpocznij grę
</Button>

// Auto mafia count:
Auto ({autoMafiaCount(nonHostPlayers.length)})
```

---

## Podsumowanie

| Obszar | Ocena | Komentarz |
|--------|-------|-----------|
| **API Routes** | 9.5/10 | Wzorcowe — handler wrapper + Zod na wszystkim |
| **DB Queries** | 9/10 | Solidne — parametryzacja, batch, separacja |
| **GameService** | 8/10 | Dobra abstrakcja — gotowa na WebSocket |
| **Zustand Store** | 7/10 | Działa poprawnie, ale boilerplate i naruszenie data flow |
| **Komponenty** | 6.5/10 | Duplikacja, magic numbers, niekonsekwentne użycie UI primitives |
| **Testy** | 5/10 | DB testy OK — brak testów hooków, store'a, komponentów |
| **Architektura ogólna** | 7.5/10 | Solidne fundamenty, ale 5 naruszeń mandatory data flow |

**Top 3 do naprawienia:**
1. Wyeliminować bezpośrednie importy `apiClient` z komponentów (5 plików)
2. Usunąć duplikacje (`positionColor`, `RankingEntry`, auto mafia count)
3. Dodać testy hooków i store'a

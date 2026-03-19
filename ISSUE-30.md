## 🎯 Cel

Kompletna przebudowa wyglądu aplikacji Mafia Game Helper na nowy styl **"Analog Intelligence Dossier"** — zimnowojennego kontrwywiadu, teczek personalnych i gumowych pieczątek. **Żadna istniejąca funkcjonalność nie zostaje usunięta ani zmieniona** — to redesign wizualny z zachowaniem 100% logiki gry.

## 📸 Propozycje wyglądu (Stitch)

| Ekran startowy | Onboarding (wybór postaci) | Lobby (widok hosta) |
|---|---|---|
| ![Home](https://raw.githubusercontent.com/giraffe-horizon/mafia-game/redesign/v2-design-assets/v2-redesign/01-home-screen.png) | ![Onboarding](https://raw.githubusercontent.com/giraffe-horizon/mafia-game/redesign/v2-design-assets/v2-redesign/02-onboarding.png) | ![Lobby](https://raw.githubusercontent.com/giraffe-horizon/mafia-game/redesign/v2-design-assets/v2-redesign/03-lobby.png) |

Design system: [`v2-redesign/DESIGN.md`](https://github.com/giraffe-horizon/mafia-game/blob/redesign/v2-design-assets/v2-redesign/DESIGN.md)

---

## 🎨 Nowy Design System — "Analog Intelligence Dossier"

### Paleta kolorów
| Token | Kolor | Użycie |
|---|---|---|
| `background` | `#131313` | Czarne biurko — bazowe tło |
| `surface-low` | `#1c1b1b` | Teczka — zagnieżdżone kontenery |
| `secondary` / "Paper" | `#d7c3b0` | Pergamin — karty, dokumenty, formularze |
| `primary` / "The Stamp" | `#ffb4ac` | Desaturowany czerwony — CTA, pieczątki, ostrzeżenia |
| `accent-green` | `#2A3A2A` (alpha) | Ekrany danych / CRT-monitor vibes (lobby, GM panel) |
| `on-surface` | `#e8e0d8` | Tekst na ciemnym tle |
| `on-secondary` | `#1a1a1a` | Tekst na pergaminie |

### Typografia
- **Font:** Space Grotesk (monospaced charakter, typewriter vibe)
- **Wszystkie nagłówki:** ALL CAPS + letter-spacing `0.1rem`
- **Stamp/pieczątki:** Font stencilowy, obrócony 2-5 stopni, border rectangular
- **Hierarchia:** Display -> Headline -> Body -> Label -> Fine print

### Kluczowe elementy wizualne
- Brak border-radius (ostre krawędzie = papier)
- Brak standardowych cieni (depth przez nakładanie warstw)
- Pieczątki gumowe ("ZATRZEZONE", "ZAJETE", "TAJNE")
- Tasma klejaca na rogach kart
- Zdjecia polaroid (awatary postaci)
- Redacted/zaczernione pola (loading states, ukryte dane)
- QR code w lobby
- Efekt grain/texture na tle
- Animacje "step" (0.1s skok) zamiast smooth transitions

---

## 📋 Plan przebudowy — wszystkie ekrany

### Faza 1: Fundamenty
- [ ] **1.1 Design system CSS/Tailwind** — nowe tokeny kolorow, font Space Grotesk, custom utility classes (`stamp`, `paper-card`, `tape-detail`, `redacted`)
- [ ] **1.2 Layout bazowy** — usunac rounded corners z PageLayout, dodac grain texture overlay, ciemny header bar z "KOD SESJI" + "STATUS: TAJNE"
- [ ] **1.3 Komponent: Button** — sharp corners, primary = coral fill, secondary = dashed border, tertiary = underline
- [ ] **1.4 Komponent: Input** — no background, single bottom border, focus = primary red
- [ ] **1.5 Komponent: Card (Dossier Sheet)** — pergaminowe tlo, paper-clip detail, tape na rogach, padding 16+
- [ ] **1.6 Komponent: Badge/Stamp** — obrocony tekst w prostokatnej ramce (TAJNE, ZAJETE, ZATRZEZONE)
- [ ] **1.7 Komponent: TabBar** — bottom tabs: NOC/DZIEN/GLOSY/LOGI z ikonami, active = pink highlight

### Faza 2: Ekrany glowne (pre-game)
- [ ] **2.1 Home Screen (HomeClient)** — dossier-style card z logo MAFIA, czaszka, "OPERACJA: [REDACTED] 1954", STWORZ GRE (coral) + DOLACZ DO GRY (dashed), 6-digit code input w stylu OTP
- [ ] **2.2 Onboarding (OnboardingScreen)** — "PSEUDONIM OPERACYJNY:" input, siatka 2x3 portretow Polaroid z pieczatka ZAJETE na zabranych, przycisk DOLACZ
- [ ] **2.3 Lobby (LobbyView)** — zielonkawy CRT-tinted card z PARAMETRY_MISJI, slider agentow wrogich, QR code sesji, ROZPOCZNIJ GRE, lista agentow z ID + pseudonim + status GOTOWY, slot "CZEKANIE NA AGENTOW..." (dashed)

### Faza 3: Ekrany nocne (role-specific)
- [ ] **3.1 Night: Mafia (NightView + NightActionPanel)** — czerwony tint, role card MAFIA z ikona maski, lista graczy do wyboru ofiary, konsensus mafii, pieczatka ZATWIERDZONE po akcji
- [ ] **3.2 Night: Policjant** — niebieski/fioletowy tint, role card POLICJANT, lista graczy + checkmark/X badges przy zbadanych, pieczatka NIEWINNY/MAFIA
- [ ] **3.3 Night: Lekarz** — zielony tint, role card LEKARZ, lista graczy do ochrony
- [ ] **3.4 Night: Cywil** — szary/wyciszony, role card CYWIL, "Czekasz w ukryciu..." z ikona ksiezyca
- [ ] **3.5 Dead Spectator (DeadSpectatorView)** — ghost overlay, czaszka, "NIE ZYJESZ", pelna lista rol (odkryte)
- [ ] **3.6 NightActionPanel refactor** — ujednolicony panel akcji w nowym stylu (wybor gracza = karty Polaroid zamiast listy?)

### Faza 4: Ekrany dnia i glosowania
- [ ] **4.1 Day Phase (DayView)** — amber/warm accent zamiast czerwonego, ikona slonca, toggle ukrycia roli (ikona oka), info card "Czas na dyskusje"
- [ ] **4.2 Voting (VotingView + VotePanel)** — "GLOSOWANIE" header, karty graczy z przyciskami glosu, live tally bar, "ZMIEN GLOS", pieczatka OSKARZONY na wybranym graczu
- [ ] **4.3 Review (ReviewView)** — misje jako dossier sheets, gwiazdki punktow, checkbox completion, pieczatka WYKONANO/NIEWYKONANO
- [ ] **4.4 End Screen** — dramatyczny reveal "MAFIA WYGRYWA" / "MIASTO WYGRYWA" w stylu pieczatki, pelna lista rol, REWANZ button, RANKING link

### Faza 5: Panel Mistrza Gry
- [ ] **5.1 GMPanel layout** — header "MISTRZ GRY" z ikona korony, 4 zakladki (GRA/WIADOMOSCI/MISJE/USTAWIENIA) w stylu tab-bar
- [ ] **5.2 GM: Game Tab (GMGameTab)** — przyciski faz (NOC->DZIEN->GLOSOWANIE->PRZEGLAD), progress tracker (agenci: done/pending), akcja za gracza
- [ ] **5.3 GM: Messages Tab (GMMessageTab)** — dropdown selector gracza, textarea, WYSLIJ, historia wiadomosci w stylu telegramow
- [ ] **5.4 GM: Missions Tab (GMMissionTab)** — formularz tworzenia misji (gracz, opis, punkty 1/2/3, preset), lista misji z complete/delete
- [ ] **5.5 GM: Settings Tab (GMSettingsTab)** — transfer GM, mafia count slider

### Faza 6: Modale i shared components
- [ ] **6.1 Ranking Modal** — "RANKING" title, tabela: pozycja (zloto/srebro/braz), pseudonim agenta, punkty, rundy. Styl ciemnych kart
- [ ] **6.2 Settings Modal** — grid awatarow (re-pick), danger zone: "OPUSC OPERACJE" red outlined button
- [ ] **6.3 GameHeader** — ciemny header bar z kodem sesji, statusem, faza, runda, ikona roli
- [ ] **6.4 PlayerRow** — Polaroid awatar + ID agenta + pseudonim + status/rola
- [ ] **6.5 PlayersList** — lista w stylu "LISTA OBECNOSCI AGENTOW" z counterem
- [ ] **6.6 MissionsList** — dossier sheets z gwiazdkami i pieczatkami
- [ ] **6.7 ToastOverlay** — powiadomienia w stylu "DEPESZA TAJNA" zamiast standardowych toastow

### Faza 7: Awatary i assets
- [ ] **7.1 Nowe portrety postaci** — 9+ noir portretow w stylu Polaroid (b/w, dramatyczne oswietlenie, fedory, woalki)
- [ ] **7.2 Ikony** — zamiana Material Symbols na custom line-art ikony (styl gumowej pieczatki) LUB stylizacja Material Symbols
- [ ] **7.3 Tekstury** — grain overlay PNG, efekt pergaminu, tasma klejaca SVG, paper-clip SVG

---

## 🔒 Zachowana funkcjonalnosc (zero zmian w logice)

Kazdy z ponizszych elementow **musi dzialac identycznie** po redesignie:

| Funkcja | Komponent(y) | Status |
|---|---|---|
| Tworzenie gry | HomeClient, `/api/game/create` | Bez zmian |
| Dolaczanie kodem 6-znakowym | HomeClient, CodeInput, `/api/game/join` | Bez zmian |
| Wybor nicku + awatara | OnboardingScreen, CharacterPicker | Bez zmian |
| Lobby: kod sesji, kopiowanie, QR | LobbyView | Bez zmian |
| Lobby: tryb gry (pelny/uproszczony) | LobbyView | Bez zmian |
| Lobby: liczba mafii (auto/manual) | LobbyView | Bez zmian |
| Start gry | gameStore.startGame | Bez zmian |
| Transfer GM | LobbyTransferGm | Bez zmian |
| Kick gracza | PlayerRow | Bez zmian |
| Noc: akcja mafii (kill) | NightActionPanel | Bez zmian |
| Noc: akcja policjanta (investigate) | NightActionPanel | Bez zmian |
| Noc: akcja lekarza (protect) | NightActionPanel | Bez zmian |
| Noc: cywil (wait) | NightActionPanel | Bez zmian |
| Noc: konsensus mafii | MafiaConsensusStatus | Bez zmian |
| Noc: oznaczenia policjanta | PlayerRow | Bez zmian |
| Zmiana decyzji | changingDecision state | Bez zmian |
| Widok martwego (spectator) | DeadSpectatorView | Bez zmian |
| Dzien: toggle ukrycia roli | DayView | Bez zmian |
| Glosowanie + live tally | VotingView, VotePanel | Bez zmian |
| Przeglad misji | ReviewView, MissionsList | Bez zmian |
| GM: fazy gry | GMGameTab | Bez zmian |
| GM: wiadomosci | GMMessageTab | Bez zmian |
| GM: misje (CRUD) | GMMissionTab | Bez zmian |
| GM: ustawienia | GMSettingsTab | Bez zmian |
| GM: akcja za gracza | GMGameTab | Bez zmian |
| Koniec gry + winner | EndScreen | Bez zmian |
| Rematch (in-place reset) | gameStore.rematch | Bez zmian |
| Ranking (modal) | RankingModal | Bez zmian |
| Ustawienia gracza (avatar re-pick, leave) | SettingsModal | Bez zmian |
| Rename w lobby | `/api/game/[token]/rename` | Bez zmian |
| Polling z pause/resume (visibility) | gameStore | Bez zmian |
| Toast notifications | ToastOverlay | Bez zmian |
| Punktacja (player_round_scores) | DB + API | Bez zmian |

---

## 🏗️ Strategia implementacji

1. **Branch:** `redesign/v2` od `main`
2. **Podejscie:** Komponent po komponencie (bottom-up) — najpierw design system tokens + base components, potem ekrany
3. **Testy:** Istniejace testy (136) musza przechodzic po kazdym etapie
4. **CI/CD:** Build na Cloudflare Pages musi dzialac po kazdym PR
5. **Estymacja:** ~7-10 dni roboczych (7 faz)

---

## 📎 Zalaczniki

- Screeny z propozycja wygladu (powyzej)
- [DESIGN.md — pelny design system](https://github.com/giraffe-horizon/mafia-game/blob/redesign/v2-design-assets/v2-redesign/DESIGN.md)
- [Stary projekt Stitch (referencyjna estetyka)](https://stitch.withgoogle.com/projects/1658528348233915887)

---

## 🔄 NOWA ARCHITEKTURA: Stałe taby (Bottom Navigation)

### Zmiana fundamentalna

**Obecny flow:** Gracz widzi JEDEN widok = aktualną fazę. Faza zmienia się → cały ekran się podmienia.

**Nowy flow:** 4 stałe taby (NOC / DZIEŃ / GŁOSY / LOGI) zawsze widoczne na dole. Gracz może swobodnie przełączać między nimi. Zawartość każdego tabu jest dynamiczna — zależy od **aktualnej fazy gry**, **roli gracza** i **statusu (żywy/martwy)**.

### Matryca zawartości tabów

#### 🌙 TAB: NOC

| Stan gry | Zawartość |
|---|---|
| Lobby | Puste / "Gra się nie rozpoczęła" |
| Faza noc + żywy Mafia | Panel akcji: lista graczy do zabicia + konsensus mafii |
| Faza noc + żywy Policjant | Panel akcji: lista graczy do zbadania + historia ✓/✗ |
| Faza noc + żywy Lekarz | Panel akcji: lista graczy do ochrony |
| Faza noc + żywy Cywil | "Czekasz w ukryciu..." + ikona księżyca |
| Faza noc + martwy | Spectator: "NIE ŻYJESZ" + pełna lista ról |
| Faza dzień/głosowanie | Podsumowanie ostatniej nocy: "Tej nocy zginął: X" lub "Nikt nie zginął" (read-only) |
| Koniec gry | Podsumowanie wszystkich nocy |

#### ☀️ TAB: DZIEŃ

| Stan gry | Zawartość |
|---|---|
| Lobby | Lista graczy + ustawienia gry (tryb, mafia count, start) — **lobby przeniesione tutaj** |
| Faza noc | "Trwa noc..." + lista graczy (role ukryte) |
| Faza dzień + żywy | Dyskusja: role peek toggle (ikona oka), lista graczy z rolami |
| Faza dzień + martwy | Spectator: lista graczy z odkrytymi rolami |
| Faza głosowanie | "Trwa głosowanie" + info |
| Koniec gry | Pełna lista ról wszystkich graczy |

#### 🗳️ TAB: GŁOSY

| Stan gry | Zawartość |
|---|---|
| Lobby | Puste / "Głosowanie będzie dostępne po rozpoczęciu gry" |
| Faza noc/dzień | Historia głosowań z poprzednich rund (jeśli round > 1). Format: "Runda 1: Wiktor — 3 głosy (wyeliminowany)" |
| Faza głosowanie + żywy | Panel głosowania: lista graczy + przyciski głosu + live tally + "ZMIEŃ GŁOS" |
| Faza głosowanie + martwy | Live tally (read-only, bez możliwości głosowania) |
| Koniec gry | Pełna historia głosowań ze wszystkich rund |

#### 📋 TAB: LOGI

| Stan gry | Zawartość |
|---|---|
| Lobby | Info o grze (kod sesji, link QR, wersja) |
| Gra trwa | Wiadomości od GM + misje gracza + historia zdarzeń per runda |
| Koniec gry | Podsumowanie: wiadomości + misje + punkty |

**Ważne:** Tab LOGI to jedyny tab który ZAWSZE ma treść niezależnie od fazy.

### Auto-switch vs swobodna nawigacja

- Przy zmianie fazy: **aktywny tab automatycznie przełącza się** na odpowiedni (noc→NOC, dzień→DZIEŃ, głosowanie→GŁOSY)
- Gracz **może ręcznie przełączać** między tabami w dowolnym momencie
- Aktywny tab = **podświetlony salmon/pink highlight**
- Nieaktywne taby: normalne, ale dostępne (nie zablokowane)

### GM Panel

GM panel **NIE wchodzi w taby** — zostaje jako overlay/drawer dostępny z headera (ikona korony / hamburger). Powód: GM potrzebuje akcji niezależnych od faz (wysyłanie wiadomości, tworzenie misji, transfer GM) — to nie jest "widok gracza" tylko panel zarządzania.

---

## 🔧 Zmiany w backendzie i API

### 1. Nowy endpoint: Historia zdarzeń (Game Log)

**`GET /api/game/[token]/log`**

Zwraca chronologiczną historię zdarzeń z całej gry. Potrzebne dla tabu LOGI i historii w tabach NOC/GŁOSY.

```typescript
interface GameLogResponse {
  rounds: {
    round: number;
    events: {
      type: 'night_kill' | 'night_save' | 'night_no_kill' | 'vote_elimination' | 'vote_tie' | 'phase_change' | 'game_start' | 'game_end';
      description: string; // np. "Tej nocy zginął: Wiktor 'Cień'"
      timestamp: string;
      details?: {
        victimId?: string;
        victimNickname?: string;
        voteCounts?: { nickname: string; votes: number }[];
      };
    }[];
  }[];
}
```

**Implementacja:** Nowa tabela `game_events` LUB parsowanie z istniejących `messages` + `game_actions` + `player_round_scores`.

**Rekomendacja:** Użyć istniejących `messages` (już teraz resolveNight/resolveVoting tworzą wiadomości broadcast). Dodać pole `event_type` do tabeli `messages` żeby odróżnić system events od wiadomości GM.

### 2. Zmiana tabeli `messages` — dodanie event_type

```sql
ALTER TABLE messages ADD COLUMN event_type TEXT DEFAULT NULL;
-- event_type: NULL = wiadomość GM, 'night_result' = wynik nocy, 'vote_result' = wynik głosowania, 'game_start' = start gry, 'game_end' = koniec gry
```

Zmiany w `resolveNight()` i `resolveVoting()`:
- Dodać `event_type = 'night_result'` / `event_type = 'vote_result'` do insertów wiadomości systemowych
- Pozwoli filtrować w API: wiadomości GM vs eventy systemowe

### 3. Rozszerzenie `GET /api/game/[token]/state` — historia głosowań

Nowe pole w `GameStateResponse`:

```typescript
// Historia głosowań z poprzednich rund (dla tabu GŁOSY poza fazą głosowania)
voteHistory?: {
  round: number;
  results: {
    nickname: string;
    playerId: string;
    votes: number;
    eliminated: boolean;
  }[];
}[];
```

**Implementacja:** Query z `game_actions` WHERE `action_type = 'vote'` GROUP BY `round`, z joinami na `game_players`.

### 4. Rozszerzenie `GET /api/game/[token]/state` — podsumowanie nocy

Nowe pole:

```typescript
// Podsumowanie ostatniej nocy (dla tabu NOC poza fazą nocy)
lastNightSummary?: {
  round: number;
  killedNickname: string | null; // null = nikt nie zginął
  savedByDoctor: boolean;
};
```

**Implementacja:** Query z `game_actions` WHERE `phase = 'night'` AND `round = current_round` (lub `current_round - 1` jeśli faza jest noc).

### 5. Zmiana flow przejść fazowych

Obecne valid transitions:
```
night → day
day → voting  
voting → night (new round)
```

**Nowy flow z review (bez zmian):**
```
night → day
day → voting
voting → review (jeśli są niezakończone misje) LUB voting → night (nowa runda)
review → ended (finalizacja) LUB review → night (kontynuacja)
```

**Bez zmian w logice** — flow fazowy sterowany przez GM w panelu, nie przez taby.

### 6. Nowe pole: activeTab tracking (opcjonalne)

Rozważenie: zapisywanie `last_active_tab` per gracz w `game_players` żeby przy reconnect pamiętać na którym tabie był. **Rekomendacja: NIE — trzymać w localStorage po stronie klienta.** Mniej obciążenia na backend.

---

## 🎮 Zmiany w rozgrywce — szczegółowa analiza

### Co się zmienia dla GRACZA

1. **Lobby → tab DZIEŃ:** Ustawienia gry, lista graczy, kod sesji — wszystko przeniesione do tabu DZIEŃ. Tab NOC i GŁOSY są puste z info "Gra nie rozpoczęta".

2. **Noc:** Gracz automatycznie ląduje na tabie NOC. Może przejść do tabu DZIEŃ (widzi listę graczy bez ról) lub LOGI (widzi swoje misje/wiadomości). Tab GŁOSY pokazuje historię z poprzednich rund.

3. **Dzień:** Auto-switch na tab DZIEŃ. Tab NOC teraz pokazuje podsumowanie nocy ("Tej nocy zginął: X"). Gracz może tam wrócić żeby sprawdzić co się stało.

4. **Głosowanie:** Auto-switch na tab GŁOSY. Tab NOC i DZIEŃ pokazują podsumowania. Gracz głosuje na tabie GŁOSY.

5. **Spectator (martwy):** Wszystkie taby dostępne. NOC = lista ról. DZIEŃ = lista ról. GŁOSY = tally (read-only). LOGI = historia.

### Co się zmienia dla GM (Mistrza Gry)

1. **GM Panel** zostaje jako drawer/overlay z headera — **bez zmian w logice**.
2. GM widzi te same 4 taby co gracze, ale z rozszerzonymi danymi (widzi role, akcje).
3. Przyciski zmiany fazy — nadal w GM Panelu, nie w tabach.

### Co się NIE zmienia

- Logika ról (mafia/policjant/lekarz/cywil)
- Akcje nocne i ich walidacja
- Głosowanie i eliminacja
- System misji i punktacji
- Rematch/rewanż
- Polling i real-time updates
- Wszystkie API endpointy (action, phase, start, kick, leave, transfer-gm, rename, message, mission)

---

## 📐 Zmiany w architekturze frontendu

### Nowy router komponentów

Obecny `GameClient.tsx` renderuje widok na podstawie `game.phase`. Nowy approach:

```
GameClient
├── GameHeader (stały)
├── TabContent (dynamiczny, zależy od activeTab + game.phase + role)
│   ├── NightTab (zawartość tabu NOC)
│   ├── DayTab (zawartość tabu DZIEŃ)  
│   ├── VotesTab (zawartość tabu GŁOSY)
│   └── LogsTab (zawartość tabu LOGI)
├── TabBar (stały, 4 taby)
└── GMPanel (drawer, tylko dla hosta)
```

### Nowy state management

```typescript
// Nowy state w gameStore
activeTab: 'night' | 'day' | 'votes' | 'logs';
setActiveTab: (tab) => void;

// Auto-switch logika (w useEffect na phase change):
if (phase === 'night') setActiveTab('night');
if (phase === 'day') setActiveTab('day');
if (phase === 'voting') setActiveTab('votes');
// review i ended nie auto-switchują — gracz zostaje gdzie jest
```

### Migracja komponentów

| Obecny komponent | Nowa lokalizacja |
|---|---|
| NightView + NightActionPanel | NightTab (aktywna faza) + NightSummary (inna faza) |
| DayView | DayTab (aktywna faza) |
| LobbyView | DayTab (faza lobby) |
| VotingView + VotePanel | VotesTab (aktywna faza) + VoteHistory (inna faza) |
| ReviewView | LogsTab lub osobny overlay |
| EndScreen | Overlay na aktywnym tabie |
| PlayersList | Shared — widoczna w DayTab i NightTab (spectator) |
| MissionsList | LogsTab |
| DeadSpectatorView | Wariant w NightTab i DayTab |
| GMPanel | Drawer z headera (bez zmian) |
| ToastOverlay | Stały (bez zmian) |
| SettingsModal | Stały (bez zmian) |
| RankingModal | Stały (bez zmian) |

---

## 📊 Zaktualizowany plan faz implementacji

### Faza 0: Backend prep (NOWA)
- [ ] **0.1** Migracja DB: dodać kolumnę `event_type` do tabeli `messages`
- [ ] **0.2** Zmiana `resolveNight()` — dodać `event_type = 'night_result'` do wiadomości systemowych
- [ ] **0.3** Zmiana `resolveVoting()` — dodać `event_type = 'vote_result'` do wiadomości systemowych
- [ ] **0.4** Rozszerzenie `getGameState()` — dodać `voteHistory` (historia głosowań z poprzednich rund)
- [ ] **0.5** Rozszerzenie `getGameState()` — dodać `lastNightSummary` (kto zginął ostatniej nocy)
- [ ] **0.6** Rozszerzenie `getGameState()` — dodać `gameLog` (wiadomości systemowe pogrupowane per runda)

### Fazy 1-7: Bez zmian (design system + ekrany + assets)
Ale z uwzględnieniem nowej architektury tabów w fazach 2-6.

### Faza 2 (zaktualizowana): Ekrany główne
- [ ] **2.1** Nowa architektura TabBar + TabContent w GameClient
- [ ] **2.2** NightTab — dynamiczna zawartość (akcja nocna LUB podsumowanie LUB spectator)
- [ ] **2.3** DayTab — dynamiczna zawartość (lobby LUB dyskusja LUB "trwa noc" LUB spectator)
- [ ] **2.4** VotesTab — dynamiczna zawartość (panel głosowania LUB historia LUB "czekaj")
- [ ] **2.5** LogsTab — wiadomości GM + misje + historia zdarzeń
- [ ] **2.6** Auto-switch logika (phase change → active tab)
- [ ] **2.7** Home Screen + Onboarding (bez zmian w architekturze, tylko redesign visual)


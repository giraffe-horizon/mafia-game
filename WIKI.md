# 🎭 Mafia Game — Kompendium Projektu

> Webowa aplikacja-pomocnik do gry Mafia/Werewolves face-to-face.
> Gracze siedzą przy stole, rozmawiają na żywo — apka na telefonie losuje role, zarządza fazami, liczy punkty.

---

## 1. Filozofia produktu

### 1.1 Czym jest ta apka
**Helper, nie zamiennik.** Apka nie zastępuje gry — wspiera ją. Gracze patrzą na siebie, kłamią, oskarżają. Apka robi to czego ludzie nie mogą: losuje role uczciwie, liczy głosy, śledzi stan gry.

### 1.2 Czym NIE jest
- Nie jest grą online/multiplayer — gracze MUSZĄ być w jednym pokoju
- Nie jest chatbotem — brak czatu między graczami (mówią na żywo)
- Nie jest turowym automatem — GM prowadzi grę, apka go wspiera

### 1.3 Dla kogo
- Grupy 4-12 osób grające w Mafię na żywo
- Imprez, wieczory planszówkowe, spotkania ze znajomymi
- GM który chce prowadzić grę bez kartek i ołówka

### 1.4 Kluczowe zasady projektowe
1. **Gracz patrzy na ludzi, nie w telefon** — UI gracza jest minimalistyczny, jedna informacja naraz
2. **GM dostaje bogaty panel** — to on jest power-userem apki
3. **Zero rejestracji** — nick + kod sesji = grasz. Żadnych kont.
4. **Mobile-first** — telefon jest jedynym urządzeniem
5. **Klimat > czystość** — design "Classified Dossier" buduje atmosferę gry

---

## 2. Aktorzy i role systemowe

### 2.1 Mistrz Gry (GM / MG)
- **Tworzy grę** — generuje kod sesji, konfiguruje ustawienia
- **NIE gra** — nie dostaje roli (mafia/cywil), nie uczestniczy w głosowaniach
- **Widzi WSZYSTKO** — role wszystkich graczy, akcje nocne, głosy w trakcie
- **Zarządza fazami** — ręcznie przełącza noc → dzień → głosowanie
- **Może** — wysyłać wiadomości, tworzyć misje, kickować, overrideować akcje
- **Jeden na grę** — GM może przekazać rolę innemu graczowi (transfer GM)
- GM ma w bazie `role = 'gm'` i `is_host = 1`

### 2.2 Gracz
- **Dołącza kodem** — wpisuje 6-znakowy kod lub skanuje QR
- **Dostaje rolę** — losowaną przez serwer po starcie gry
- **Widzi TYLKO swoją rolę** — ukrytą za tapnięciem (ochrona przed podglądaniem)
- **Wykonuje akcje** — nocne (zabij/sprawdź/chroń) lub głosuje w dzień
- **Ma unikalny URL** — `/game/[token]`, bookmark = powrót do gry

### 2.3 Martwy gracz (widz / spectator)
- **Widzi role WSZYSTKICH graczy** — to celowa decyzja projektowa, nie bug
- **Uzasadnienie:** Martwy gracz siedzi przy stole i obserwuje. Widząc prawdę, może weryfikować swoje wcześniejsze podejrzenia i śledzić intrygę z pozycji wszechwiedzy. To nagradza eliminację treścią zamiast pustego ekranu.
- **Ryzyko podpowiedzi:** Tak, martwy może teoretycznie szeptać żywym. To jest ryzyko akceptowalne — gra jest face-to-face, gracze sami pilnują fair play. Apka nie może kontrolować co ludzie mówią przy stole.
- **Widzi:** Raport pośmiertny (stosunek sił mafia vs cywile), odkryte role, aktualną fazę
- **NIE może:** Głosować, wykonywać akcji, wysyłać wiadomości

---

## 3. Role w grze

### 3.1 Mafia
- **Akcja nocna:** `kill` — głosuje na ofiarę nocy
- **Cel:** Wyeliminować wszystkich cywili (mafia ≥ liczba dobrych = wygrana)
- **Widzi:** Swoich wspólników (oznaczeni ikoną group w liście graczy)
- **Głosowanie mafii:** Jeśli jest >1 mafia, MUSZĄ jednomyślnie wybrać cel. Brak konsensusu = nikt nie ginie.
- **Ważne:** Każdy mafioso głosuje osobno w apce. GM widzi kto na kogo.

### 3.2 Policjant (Detective)
- **Akcja nocna:** `investigate` — sprawdza jedną osobę, dowiaduje się czy to mafia
- **Wynik:** Widoczny w fazie dnia jako "Wynik śledztwa" — ale TYLKO gdy policjant odkrył swoją rolę tapnięciem RoleCard (patrz sekcja 17). Gdy rola ukryta, widzi ogólne "Akcja wykonana"
- **Ograniczenie:** Nie może sprawdzić tej samej osoby dwa razy (już sprawdzone osoby oznaczone "sprawdzony")
- **Pamiętaj:** Wyniki śledztwa kumulują się — policjant widzi listę wszystkich sprawdzonych osób

### 3.3 Lekarz (Doctor)
- **Akcja nocna:** `protect` — chroni wybraną osobę przed zabójstwem mafii
- **Ograniczenie:** NIE MOŻE chronić tej samej osoby dwa razy z rzędu (poprzednio chroniony oznaczony "chroniony")
- **Efekt:** Jeśli mafia zaatakuje chronioną osobę, nikt nie ginie + wyświetla się "Lekarz uratował ofiarę!"
- **Może chronić siebie:** Tak (ale nie dwa razy z rzędu)

### 3.4 Cywil (Civilian)
- **Akcja nocna:** `wait` — brak akcji, czeka na świt
- **Widok nocny:** Klimatyczny ekran "Obserwacja Nocna" z losowymi tekstami atmosferycznymi i fake progress barem "Do świtu"
- **Rola w dyskusji:** Obserwuje, podejrzewa, oskarża — siła cywili leży w liczbie i w rozmowie

### 3.5 Proporcje ról (automatyczne)

**Tryb pełny (full):** Mafia + Policjant + Lekarz + Cywile

| Liczba graczy | Mafia | Policjant | Lekarz | Cywile |
|:---:|:---:|:---:|:---:|:---:|
| 5 | 1 | 1 | 1 | 2 |
| 6–8 | 2 | 1 | 1 | reszta |
| 9–11 | 3 | 1 | 1 | reszta |
| 12+ | 4 | 1 | 1 | reszta |

**Tryb uproszczony (simple):** Tylko Mafia vs Cywile

| Liczba graczy | Mafia | Cywile |
|:---:|:---:|:---:|
| 3–4 | 1 | reszta |
| 5–8 | ⌊n/3⌋ | reszta |
| 9+ | ⌊n/3⌋ | reszta |

GM może ręcznie ustawić liczbę mafii (override auto).

---

## 4. Przepływ rozgrywki

### 4.1 Cykl gry (diagram)

```
STRONA GŁÓWNA
    ↓ "Stwórz grę" / "Dołącz do gry"
LOBBY
    ↓ GM klika "Rozpocznij grę" (min. 3 graczy simple / 5 full)
NOC (Runda 1)
    ↓ GM klika "Zacznij dzień" (po akcjach nocnych)
DZIEŃ
    ↓ GM klika "Zacznij głosowanie"
GŁOSOWANIE
    ↓ GM klika "Zacznij noc"
NOC (Runda 2)
    ↓ ... powtarzaj ...
[KONIEC GRY] ← gdy warunek wygranej spełniony
    ↓ (opcjonalnie)
PRZEGLĄD MISJI ← GM ocenia misje przed zakończeniem
    ↓
EKRAN KOŃCOWY ← ranking, wyniki, "Następna runda"
    ↓
LOBBY ← rematch (te same tokeny, nowa gra)
```

### 4.2 Szczegóły faz

#### LOBBY
**Kto widzi co:**
- **GM:** QR code + kod sesji, lista graczy, ustawienia (tryb gry, liczba mafii, tajne głosowanie), przycisk "Rozpocznij grę"
- **Gracz:** Ekran onboardingu (podaj nick + wybierz postać), potem "Czekaj na start"

**Ustawienia GM:**
- Tryb gry: Pełny / Uproszczony
- Liczba mafii: Auto / ręcznie (1, 2, 3...)
- Tajne głosowanie: ON/OFF (domyślnie OFF)

**Warunki startu:**
- Minimum 3 graczy (simple) lub 5 graczy (full), nie licząc GM
- Wszyscy gracze muszą zakończyć onboarding (nick + postać)

#### NOC
**Kto widzi co:**
- **Mafia:** Lista celów do zabicia + status głosowania zespołu (kto na kogo głosuje)
- **Policjant:** Lista osób do sprawdzenia (bez już sprawdzonych)
- **Lekarz:** Lista osób do ochronienia (bez chronionego w poprzedniej rundzie)
- **Cywil:** Ekran "Obserwacja Nocna" (klimatyczny tekst + progress bar)
- **GM:** Panel z postępem akcji (kto wykonał, kto czeka), override graczy, przycisk "Zacznij dzień"
- **Martwy:** Raport pośmiertny z odkrytymi rolami

**Rozstrzyganie nocy (resolveNight):**
1. Zbierz akcje `kill` od żywej mafii
2. Jeśli solo mafia → cel zabity
3. Jeśli >1 mafia → MUSZĄ głosować jednomyślnie. Brak konsensusu = nikt nie ginie.
4. Sprawdź czy cel był chroniony przez lekarza → jeśli tak, nikt nie ginie + "Lekarz uratował ofiarę"
5. Sprawdź warunki wygranej
6. Wyślij wiadomość systemową z wynikiem nocy

**GM może:**
- Przejść do dnia nawet jeśli nie wszyscy wykonali akcje
- Override akcji gracza (wykonać za niego)
- Widzi kto na kogo głosuje w mafii

#### DZIEŃ
**Kto widzi co:**
- **Gracz:** Swoją rolę (ukrytą), wynik nocy, listę żywych graczy, komunikat "Dyskutujcie i szukajcie mafii"
- **Policjant:** Dodatkowo wynik śledztwa z ostatniej nocy (gdy rola odkryta)
- **GM:** Panel GM — te same opcje co w nocy + przycisk "Zacznij głosowanie"
- **Martwy:** Raport pośmiertny

**Ważne:** W fazie dnia ŻADNE akcje nie są możliwe w apce. Dyskusja toczy się na żywo.

#### GŁOSOWANIE
**Kto widzi co:**
- **Żywy gracz:** Lista żywych graczy do oskarżenia + swój oddany głos
- **GM:** Postęp głosowania (X/Y zagłosowało), głosy na żywo, override
- **Martwy:** Raport pośmiertny (NIE głosuje)

**Potwierdzenie głosu:**
- Przed oddaniem głosu wyświetla się dialog potwierdzenia: "Czy na pewno oskarżasz [NICKNAME]?"
- Gracz może zmienić głos po oddaniu (przycisk "Zmień głos")

**Tajne głosowanie (opcja GM):**
- Gdy włączone: gracze widzą TYLKO "X/Y zagłosowało" — bez nazwisk, bez progress barów
- GM nadal widzi pełne wyniki na żywo
- Domyślnie wyłączone — GM włącza w lobby

**Rozstrzyganie głosowania (resolveVoting):**
1. Policz głosy na każdego gracza
2. Gracz z największą liczbą głosów = wyeliminowany
3. Remis = nikt nie wyeliminowany (brak dogrywki)
4. Sprawdź warunki wygranej
5. Wyślij wiadomość systemową z wynikiem

#### PRZEGLĄD MISJI (review)
- Wyświetlany TYLKO gdy istnieją nieocenione misje w momencie spełnienia warunku wygranej
- GM ocenia każdą misję: Wykonana ✓ / Niewykonana ✗
- Po ocenie → GM klika "Zakończ rundę"
- Gracz widzi: "MG ocenia misje..." (czeka)

#### KONIEC GRY (ended)
**Kto widzi co:**
- **Wszyscy:** Kto wygrał (Mafia / Miasto), scoring table, ranking
- **Gracz:** "Wygrałeś!" / "Przegrałeś" + swoją rolę
- **GM:** Przycisk "Następna runda" (rematch)

**Rematch:**
- Resetuje grę w miejscu — te same tokeny URL, ten sam lobby
- Numer rundy się zwiększa (cumulative ranking)
- Role losowane od nowa
- Ustawienia zachowane z poprzedniej gry

---

## 5. Warunki wygranej

Sprawdzane po KAŻDEJ eliminacji (nocna lub głosowanie):

| Warunek | Zwycięzca |
|---------|-----------|
| Żywa mafia = 0 | **Miasto** (town) |
| Żywa mafia ≥ żywi dobrzy | **Mafia** |

"Dobrzy" = wszyscy nie-mafia (policjant, lekarz, cywile).

---

## 6. System punktów i ranking

### 6.1 Punktacja (per gracz per runda)
| Kategoria | Punkty |
|-----------|--------|
| Przeżycie do końca rundy | +1 |
| Wygrana z drużyną | +3 |
| Wykonanie misji | wg misji (1/2/3) |

### 6.2 Ranking
- **Per sesja (cumulative):** Suma punktów z wszystkich rund w jednej sesji
- **Wyświetlany:** Na ekranie końcowym + tab "Agenci" → Ranking
- **Sortowanie:** Malejąco po total_score

---

## 7. System misji

### 7.1 Koncept
Misje to dodatkowe zadania od GM — unikalna mechanika która dodaje warstwę blefowania i aktorstwa.

### 7.2 Jak działają
1. **GM tworzy misję** — wybiera gracza, opis zadania, punkty (1/2/3)
2. **Gracz widzi misję** na swoim ekranie (tab "Agenci" → Logi operacyjne)
3. **Gracz próbuje wykonać** misję podczas gry na żywo
4. **GM zatwierdza** wykonanie w fazie "Przegląd misji" lub w panelu GM
5. **Punkty doliczane** do rankingu gracza

### 7.3 Presety misji
Apka ma 20 predefiniowanych misji w 3 kategoriach:
- **Łatwe (1 pkt):** "Powiedz słowo mafia 5 razy", "Milcz przez pierwszą turę"
- **Średnie (2 pkt):** "Przekonaj kogoś że jesteś lekarzem", "Zaproponuj sojusz"
- **Trudne (3 pkt):** "Doprowadź do eliminacji gracza nie głosując na niego", "Przekonaj wszystkich że jesteś policjantem nie będąc nim"

GM może też wpisać własny opis misji.

### 7.4 Misje a koniec gry
- Jeśli warunek wygranej spełniony ale są nieocenione misje → gra wchodzi w fazę REVIEW
- GM ocenia misje, potem klika "Zakończ rundę" → gra przechodzi do ENDED

---

## 8. System wiadomości

### 8.1 Wiadomości GM
- GM może wysłać wiadomość do konkretnego gracza lub do wszystkich (broadcast)
- Wyświetlane jako toast (popup "Depesza tajna") + w logu operacyjnym (tab Agenci)
- Trwają 7 sekund jako toast, potem dostępne w logu

### 8.2 Wiadomości systemowe (event_type)
- `night_result` — wynik nocy ("Tej nocy zginął: X" / "Nikt nie zginął")
- `vote_result` — wynik głosowania ("X został wyeliminowany")
- Wyświetlane w Game Log (tab Agenci → Historia zdarzeń)
- NIE wyświetlane jako toasty podczas transition screens (żeby nie duplikować)

---

## 9. Widoczność informacji (kto widzi co)

### 9.1 Matryca widoczności ról

| Informacja | Gracz (żywy) | Mafia (żywa) | GM | Martwy |
|-----------|:---:|:---:|:---:|:---:|
| Własna rola | ✅ (ukryta za tapem) | ✅ | — | ✅ |
| Role innych żywych | ❌ | Tylko mafia-teammates | ✅ | ✅ |
| Role martwych | ❌ | ❌ | ✅ | ✅ |
| Akcje nocne | Tylko swoja | Swoja + team kill votes | ✅ wszystkie | ❌ |
| Głosy | Tylko swój (+ tally) | Tylko swój (+ tally) | ✅ wszystkie | Tally |
| Misje | Tylko swoje | Tylko swoje | ✅ wszystkie | Swoje |
| Wynik detektywa | Tylko jeśli jest detektywem | ❌ | ✅ | ❌ |
| Wiadomości GM | Skierowane do niego | Skierowane do niego | ✅ | ❌ |

### 9.2 Specjalne przypadki
- **Policjant po śmierci:** Wyniki śledztw przepadają (nie są udostępniane innym)
- **Mafia po śmierci towarzysza:** Żywa mafia nadal widzi wspólników
- **Po zakończeniu gry:** WSZYSTKIE role odkryte dla WSZYSTKICH

### 9.3 Tajne głosowanie
Gdy GM włączy tajne głosowanie w lobby:
- Gracz widzi: swój głos + "X/Y zagłosowało" (bez nazwisk)
- GM widzi: pełne wyniki na żywo (kto na kogo)
- Po zakończeniu głosowania: wynik widoczny dla wszystkich (kto wyeliminowany)
- Historia głosowań (tab Głosy): pełne wyniki widoczne PO zakończeniu rundy

---

## 10. Onboarding gracza

### 10.1 Flow dołączania
1. Gracz wchodzi na stronę główną
2. Klika "Dołącz do gry" → wpisuje 6-znakowy kod LUB skanuje QR (auto-fill kodu)
3. Serwer generuje unikalny token gracza → redirect na `/game/[token]`
4. Ekran onboardingu: podaj pseudonim + wybierz postać (avatar)
5. Po zatwierdzeniu → gracz w lobby, status "GOTOWY"

### 10.2 Postaci (characters)
- Pula predefiniowanych postaci z awatarami (pliki w `/avatars/`)
- Każda postać ma: id, slug, nazwę PL, avatar URL, gender
- Postać jest UNIKALNA w sesji — dwóch graczy nie może wybrać tej samej
- GM nie wybiera postaci (ma domyślny nick "Mistrz Gry")
- Gracz może zmienić postać w ustawieniach (ikona w headerze)

### 10.3 Tokeny i identyfikacja
- Każdy gracz ma unikalny token (nanoid 21 znaków) w URL
- Token = identyfikacja gracza + sesji (1:1)
- Brak logowania — kto ma link, ten jest w grze
- Token jest kryptograficznie losowy — nie do zgadnięcia

---

## 11. UI i nawigacja

### 11.1 Struktura ekranów

```
STRONA GŁÓWNA (/)
├── "Stwórz grę" → redirect /game/[gm-token]
└── "Dołącz do gry" → kod → redirect /game/[player-token]

GRA (/game/[token])
├── Header: faza, runda, kod sesji, avatar/settings
├── Taby (bottom navigation):
│   ├── 🌙 Noc — akcje nocne, wyniki nocy
│   ├── ☀️ Dzień — lobby (pre-game) / GM panel / widok dnia
│   ├── 🗳️ Głosy — głosowanie / historia głosowań
│   └── 👥 Agenci — lista graczy, ranking, logi, misje
├── Overlay: Transition screens (zmiana fazy)
├── Overlay: Toast (wiadomości GM)
└── Overlay: End screen (koniec gry)
```

### 11.2 Auto-switch tabów
Gdy GM zmienia fazę, apka automatycznie przełącza aktywny tab:
- Faza noc → tab "Noc"
- Faza dzień → tab "Dzień"
- Faza głosowanie → tab "Głosy"
- Review/ended → zostaje na aktualnym tabie

### 11.3 Badge notifications
Pulsująca czerwona kropka na tabie gdy jest nowa treść na innym tabie:
- Nowe wyniki nocy → badge na tabie "Noc"
- Nowe głosowanie → badge na tabie "Głosy"
- Nowa wiadomość GM → badge na tabie "Agenci"
- Badge znika gdy user wchodzi na tab

### 11.4 Transition screens
Pełnoekranowe animowane overlaye przy zmianie fazy:
- **Start gry:** "Gra rozpoczęta!" → "Zapada noc... Runda 1"
- **Noc → Dzień:** "Nadchodzi świt..." → "[Nickname] nie przeżył tej nocy" / "Wszyscy przeżyli!"
- **Dzień → Głosowanie:** "Głosowanie — Czas na oskarżenia"
- **Głosowanie → Noc:** "Wyrok zapadł... [Nickname] wyeliminowany" → "Zapada noc... Runda X"
- **Koniec gry:** "Mafia wygrywa!" / "Miasto wygrywa!"
- Wibracja telefonu przy każdym ekranie (mocniejsza przy śmierci)
- GM może pominąć (przycisk "Pomiń")
- Gracz może kliknąć aby przyspieszyć

### 11.5 Potwierdzenia akcji (Confirm Dialog)
Przed krytycznymi akcjami wyświetla się dialog potwierdzenia:
- **Głosowanie:** "Czy na pewno oskarżasz [X]?" → OSKARŻAM / ANULUJ
- **Kill (mafia):** "Czy na pewno chcesz wytypować [X] jako ofiarę nocy?" → ZATWIERDŹ ROZKAZ / ANULUJ
- **Investigate:** "Czy na pewno chcesz przesłuchać [X]?" → ZATWIERDŹ ROZKAZ / ANULUJ
- **Protect:** "Czy na pewno chcesz chronić [X] tej nocy?" → ZATWIERDŹ ROZKAZ / ANULUJ
- **Cywil (wait):** BEZ potwierdzenia (nie ma co potwierdzać)

### 11.6 RoleCard (odkrywanie roli)
- Domyślnie rola UKRYTA — gracz widzi "Stuknij aby zobaczyć rolę" z zaczernionym blokiem
- Jedno tapnięcie → odkrywa rolę (pełna karta z ikoną, nazwą, stampem)
- Drugie tapnięcie → chowa rolę
- Rola automatycznie chowa się przy nowej rundzie
- Cel: ochrona przed podglądaniem przez sąsiadów przy stole

---

## 12. Panel Mistrza Gry (GM)

### 12.1 Lokalizacja
GM widzi swój panel na tabie "Dzień" (zamiast widoku dnia dla graczy). Ma 4 sub-taby:

### 12.2 Sub-tab: GRA
- **Postęp akcji:** Lista graczy z statusem (✓ wykonał / ⏳ czeka), rola, progress bar
- **Mafia consensus:** Ostrzeżenie gdy mafia nie jest zgodna
- **Override gracza:** GM może wykonać akcję za gracza (dropdown gracz → dropdown cel → zatwierdź)
- **Przycisk zmiany fazy:** "Zacznij dzień" / "Zacznij głosowanie" / "Zacznij noc"
  - **Domyślnie zablokowany** dopóki nie wszystkie wymagane akcje wykonane lub mafia nie jest jednomyślna
  - Pod przyciskiem wyświetla się lista brakujących akcji ("Czekaj na: Anna, Marek")
  - **GM może wymusić przejście** mimo brakujących akcji — przycisk override jest dostępny zawsze, ale standardowy flow wymaga kompletności

### 12.3 Sub-tab: WIADOMOŚCI
- Wyślij wiadomość do wybranego gracza lub do wszystkich
- Pole tekstowe + dropdown z listą graczy

### 12.4 Sub-tab: MISJE
- Utwórz nową misję: wybierz gracza, opis (lub preset), punkty
- Lista aktywnych misji z przyciskami Wykonana/Niewykonana
- Presety misji do szybkiego wyboru

### 12.5 Sub-tab: USTAWIENIA
- Podgląd graczy (role, status)
- Konfiguracja liczby mafii (dla rematchu)

---

## 13. Architektura techniczna (podsumowanie)

### 13.1 Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4
- **State:** Zustand 5 (gameSlice, actionsSlice, uiSlice, scoringSlice)
- **Backend:** API Routes na Cloudflare Workers (Edge Runtime)
- **Baza:** Cloudflare D1 (SQLite)
- **Deploy:** Cloudflare Pages via @opennextjs/cloudflare
- **Real-time:** Polling co 2 sekundy (GET /api/game/[token]/state)

### 13.2 Data flow
```
UI Component → Zustand Store → GameService → API Client → API Route → DB Query → D1
                    ↑                                                        ↓
                    └──────────── Polling (2s) ← API Response ←──────────────┘
```

### 13.3 Identyfikacja
- Gracz = token w URL (`/game/[token]`)
- Token = nanoid 21 znaków, kryptograficznie losowy
- Gra = 6-znakowy kod (alfanumeryczny, bez mylących znaków)
- Brak autentykacji — security through obscurity (token = sesja)

### 13.4 Polling vs SSE
- Obecnie: HTTP polling co 2s — prosty, niezawodny, działa na CF free tier
- Przyszłość: SSE lub Durable Objects + WebSocket (płatny plan CF)
- Backoff: przy błędach delay rośnie exponentially (max 16s)
- Visibility API: polling pauzuje gdy tab jest w tle

---

## 14. Design System

### 14.1 Motyw: "Classified Dossier"
Ekran jako biurko agenta pod lampą — teczki, dokumenty, pieczątki. Nie "retro" — raczej **analogowy wywiad**.

### 14.2 Kolory
- **Background:** `#131313` (ciemne biurko)
- **Paper/Secondary:** `#d7c3b0` (zniszczony dokument)
- **Primary/Stamp:** `#ffb4ac` / `#da0b0b` (pieczątka czerwona)
- **Stamp Green:** Akcenty zielone na CRT-style elementach

### 14.3 Typografia
- **Body:** Be Vietnam Pro
- **Display/Labels:** Special Elite (typewriter)
- **Ikony:** Material Symbols Outlined

### 14.4 Komponenty kluczowe
- `Stamp` — pieczątka (classified/approved/rejected)
- `Card` — teczka/dokument
- `Badge` — etykieta roli (kolorowa per rola)
- `ConfirmDialog` — dialog potwierdzenia z "ZATWIERDŹ ROZKAZ"
- `CRT Monitor` — zielony gradient na elementy lobby (symulacja monitora)

---

## 15. Słownik pojęć

| Termin | Znaczenie |
|--------|-----------|
| **GM / MG** | Mistrz Gry — prowadzi grę, nie uczestniczy |
| **Token** | Unikalny identyfikator gracza w URL |
| **Kod sesji** | 6-znakowy kod do dołączenia (np. MAFIA-X7K2) |
| **Faza** | Etap gry: lobby, night, day, voting, review, ended |
| **Runda** | Cykl noc→dzień→głosowanie (numer rośnie) |
| **Rematch** | Reset gry w miejscu — nowe role, kontynuacja rankingu |
| **Consensus** | Jednomyślność mafii w wyborze ofiary |
| **Override** | GM wykonuje akcję za gracza |
| **Transition** | Animowany ekran przy zmianie fazy |
| **Toast** | Popup z wiadomością GM (7s) |
| **Misja** | Dodatkowe zadanie od GM za punkty |
| **Tajne głosowanie** | Opcja GM — głosy ukryte do końca |

---

## 16. Edge cases i FAQ

### 16.1 Gracz wychodzi / AFK w trakcie gry
- **W lobby:** Gracz usuwany z gry (DELETE z tabeli game_players)
- **W trakcie gry (playing):** Gracz oznaczany jako martwy (`is_alive = 0`), NIE usuwany. Jego rola zostaje w systemie. Natychmiast sprawdzane warunki wygranej — jeśli odejście kończy grę, gra się kończy.
- **GM nie może opuścić gry** — musi najpierw przekazać rolę GM innemu graczowi
- **Brak auto-kicka za AFK** — GM ręcznie decyduje (kick lub override akcji)
- **Reconnect:** Gracz wraca przez ten sam URL (`/game/[token]`). Token jest w URL — bookmark = powrót. Jeśli gracz stracił URL, nie ma mechanizmu odzyskania (brak kont).

### 16.2 Kick gracza przez GM
- **W lobby:** Gracz usuwany z gry (fizyczne DELETE)
- **W trakcie gry:** Gracz oznaczany jako martwy (jak przy leaveGame). Warunki wygranej sprawdzane natychmiast — kick może zakończyć grę.
- **Rola kickowanego:** Zostaje w systemie (widoczna dla martwych i GM). Nie wpływa na balans — jest traktowany jak wyeliminowany.

### 16.3 Transfer GM
**Flow krok po kroku:**
1. GM otwiera lobby (tab Dzień → sekcja na dole)
2. Wybiera gracza z listy do przekazania
3. Potwierdza transfer
4. **Stary GM:** Traci `is_host`, dostaje rolę `civilian` (jeśli gra trwa) lub `null` (lobby)
5. **Nowy GM:** Dostaje `is_host = 1`, rola zmienia się na `gm` (jeśli gra trwa)
6. Nowy GM widzi panel GM, stary GM widzi widok gracza
- Transfer możliwy TYLKO z poziomu aktualnego GM
- W lobby: stary GM staje się zwykłym graczem (może dostać rolę przy starcie)
- W trakcie gry: stary GM dołącza jako cywil (żywy)

### 16.4 Remis w głosowaniu
- Jeśli dwóch (lub więcej) graczy ma tyle samo głosów → **nikt nie jest wyeliminowany**
- Brak dogrywki, brak losowania — remis = nikt nie odpada
- Gra przechodzi normalnie do kolejnej fazy (noc)
- To celowa decyzja — w grze face-to-face remis jest sygnałem że dyskusja się nie rozstrzygnęła

### 16.5 Zmiana głosu
- **Głosowanie (dzień):** Gracz MOŻE zmienić głos — przycisk "Zmień głos" po oddaniu
- **Akcje nocne:** Gracz MOŻE zmienić decyzję — przycisk "Zmień głos" / "Zmień" (overwrite poprzedniej akcji)
- **Mafia nocna:** Każdy mafioso może zmienić swój głos kill niezależnie

### 16.6 Rematch — kto może dołączyć?
- Rematch resetuje grę IN-PLACE — te same tokeny URL, ten sam lobby
- **Gracze z poprzedniej gry:** Automatycznie w lobby (nie muszą nic robić)
- **Nowi gracze:** NIE mogą dołączyć do rematchu — lobby nie akceptuje nowych joinów
- **Gracze którzy wyszli:** Nie wracają (ich token jest martwy)
- Numer rundy się zwiększa, ranking kumuluje się

### 16.7 Sytuacja 1 mafia vs 1 cywil
- Warunek: `mafia ≥ dobrzy` → `1 ≥ 1` = **TRUE**
- **Mafia wygrywa.** To standardowa zasada Mafii — gdy mafia zrównuje się z dobrymi, przejmuje kontrolę.
- Apka wyświetla: "Mafia wygrywa! — Przestępcy przejęli kontrolę"

### 16.8 Martwy policjant — co z wynikami śledztw?
- Martwy policjant **nadal widzi** swoje wyniki śledztw (w swoim widoku)
- Wyniki **NIE są udostępniane** innym graczom (żywym ani martwym)
- Wyniki przepadają "publicznie" — nikt inny nie może ich zobaczyć
- Po zakończeniu gry: role wszystkich odkryte, ale wyniki śledztw nie są prezentowane osobno

### 16.9 Limit misji
- **Brak limitu** na liczbę misji na gracza/rundę
- GM sam decyduje ile misji przydzielić — to narzędzie narracyjne, nie mechaniczne
- Sugestia: 1-2 misje na gracza na rundę dla dobrego balansu

### 16.10 Co jeśli zostanie mniej graczy niż minimum?
- Warunki wygranej są sprawdzane **po każdej eliminacji** (noc, głosowanie, kick, leave)
- Jeśli wynik eliminacji spełnia warunek `mafia = 0` lub `mafia ≥ dobrzy` → gra się kończy
- Nie ma osobnego sprawdzania "minimum graczy" — gra kończy się organicznie przez warunki wygranej
- Przykład: 2 graczy (1 mafia + 1 cywil) → mafia wygrywa (16.7)

---

## 17. Wyjaśnienie: "rola odkryta" (RoleCard)

W kilku miejscach Wiki pojawia się fraza "gdy rola odkryta". Oznacza to:

**Gracz musi tapnąć RoleCard żeby zobaczyć swoją rolę.** Domyślnie rola jest UKRYTA (czarny blok z tekstem "Stuknij aby zobaczyć rolę"). Po tapnięciu — karta się odkrywa i gracz widzi pełne informacje.

To dotyczy:
- **Wyniku śledztwa policjanta** — widoczny TYLKO gdy policjant odkrył swoją rolę (tapnął RoleCard). Jeśli rola ukryta, widzi "Akcja wykonana" bez szczegółów.
- **Akcji nocnych** — gdy rola ukryta, gracz widzi "Noc — czekaj na rozkazy. Odkryj rolę aby wykonać akcję nocną"
- **Wspólników mafii** — oznaczeni ikoną TYLKO gdy mafioso odkrył swoją rolę

To NIE jest publiczne ujawnienie roli — to mechanizm prywatny, na ekranie gracza. Nikt inny nie widzi czy gracz odkrył swoją rolę.

---

*Ostatnia aktualizacja: 2026-03-21*
*Wersja: 2.1 (po review rady)*

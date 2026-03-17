# Mafia Game Helper

Aplikacja wspomagająca grę w mafię face-to-face. Pozwala na prowadzenie gier w trybie offline z wykorzystaniem nowoczesnego interfejsu webowego, systemem misji i rankingiem per-sesja.

## 🎯 Opis projektu

Mafia Game Helper to interaktywna aplikacja webowa zaprojektowana do wspierania tradycyjnej gry w mafię podczas spotkań towarzyskich. Aplikacja umożliwia:

- **Zarządzanie grami**: Tworzenie gier, dołączanie przez QR kody, automatyczne przypisywanie ról
- **Różne tryby gry**: Pełny (mafia + policjant + lekarz + cywile) i uproszczony (mafia + cywile)
- **System misji**: 20+ predefiniowanych misji z różnymi poziomami trudności
- **Ranking per-sesja**: Punktowanie i statystyki graczy w ramach jednej sesji
- **Panel Mistrza Gry**: Narzędzia do zarządzania grą, wysyłania wiadomości, override'u akcji
- **Funkcje społecznościowe**: Rematch, transfer GM, zmiana nazwy w lobby

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Edge Runtime
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages z @cloudflare/next-on-pages
- **Development**: TypeScript, ESLint, Prettier, Husky

## 🏗 Architektura

### Runtime i deployment
- **Edge Runtime**: Wszystkie API routes działają w Cloudflare Workers
- **App Router**: Wykorzystanie najnowszej architektury Next.js 15
- **Real-time updates**: Polling co 2 sekundy dla synchronizacji stanu gry
- **Database**: D1 SQLite z 6 tabelami (games, players, game_players, actions, messages, missions)

### Tryby gry
- **Pełny tryb** (minimum 5 graczy):
  - Mafia, Detective (policjant), Doctor (lekarz), Civilian (cywil)
  - Wszystkie specjalne akcje nocne
- **Uproszczony tryb** (minimum 3 graczy):
  - Tylko Mafia vs Civilian
  - Brak specjalnych ról

### Role w grze
- **Mafia**: Eliminuje graczy podczas nocy
- **Detective (Policjant)**: Sprawdza tożsamość gracza podczas nocy
- **Doctor (Lekarz)**: Chroni gracza podczas nocy
- **Civilian (Cywil)**: Brak specjalnych akcji
- **GM (Mistrz Gry)**: Prowadzi grę, nie bierze udziału jako gracz

### Fazy gry
1. **Lobby**: Dołączanie graczy, konfiguracja
2. **Noc**: Specjalne akcje (mafia, detective, doctor)
3. **Dzień**: Dyskusja i przedstawienie informacji
4. **Głosowanie**: Eliminacja gracza głosami
5. **Review**: Podsumowanie rundy
6. **Koniec**: Wyniki i możliwość rematch

## 🎮 Funkcjonalności

### Zarządzanie grami
- ✅ Tworzenie gry z 6-znakowym kodem
- ✅ QR kody do łatwego dołączania
- ✅ Automatyczne przypisywanie ról
- ✅ Transfer uprawnień GM między graczami
- ✅ Kopanie graczy z gry
- ✅ System rematch dla kolejnych gier

### System misji
- ✅ 20+ predefiniowanych misji
- ✅ Różne poziomy trudności (1-3 punkty)
- ✅ Misje tajne i jawne
- ✅ Kategoryzacja misji (łatwe, średnie, trudne)
- ✅ Dynamiczne przypisywanie misji przez GM

### Panel GM
- ✅ Przegląd wszystkich graczy i ich ról
- ✅ Wysyłanie prywatnych wiadomości do graczy
- ✅ Override akcji nocnych
- ✅ Zarządzanie fazami gry
- ✅ Kontrola nad misjami

### UX/UI Features
- ✅ Responsywny design na wszystkie urządzenia
- ✅ Zmiana nazwy gracza w lobby
- ✅ Ranking punktowy w czasie rzeczywistym
- ✅ Kolorowe oznaczenia ról i statusów
- ✅ Intuicyjny interfejs dla wszystkich faz gry

## 🔗 API Endpoints

Wszystkie endpointy znajdują się w `app/src/app/api/game/`:

### Zarządzanie grami
- `POST /api/game/create` - Tworzenie nowej gry
- `POST /api/game/join` - Dołączanie do gry

### Stan gry
- `GET /api/game/[token]/state` - Pobieranie aktualnego stanu gry
- `POST /api/game/[token]/start` - Start gry (tylko GM)
- `POST /api/game/[token]/phase` - Zmiana fazy gry
- `POST /api/game/[token]/finalize` - Finalizacja gry

### Akcje graczy
- `POST /api/game/[token]/action` - Wysyłanie akcji (głosowanie, akcje nocne)
- `POST /api/game/[token]/rename` - Zmiana nazwy gracza
- `POST /api/game/[token]/message` - Wysyłanie wiadomości

### Zarządzanie uczestnikami
- `POST /api/game/[token]/kick` - Kopanie gracza (tylko GM)
- `POST /api/game/[token]/transfer-gm` - Transfer uprawnień GM
- `POST /api/game/[token]/rematch` - Tworzenie nowej gry (rematch)

### System misji
- `POST /api/game/[token]/mission` - Tworzenie misji
- `DELETE /api/game/[token]/mission/[missionId]` - Usuwanie misji
- `POST /api/game/[token]/mission/[missionId]/complete` - Ukończenie misji

## 📁 Struktura plików

### Kluczowe komponenty
```
app/src/
├── app/
│   ├── page.tsx                    # Strona główna - tworzenie/dołączanie
│   ├── game/[token]/
│   │   ├── page.tsx                # Wrapper dla GameClient
│   │   └── GameClient.tsx          # Główny komponent gry (1000+ linii)
│   ├── ranking/
│   │   └── page.tsx                # System rankingu
│   └── api/game/                   # API routes (15 endpointów)
├── lib/
│   ├── db.ts                       # Logika bazy danych (1250+ linii)
│   ├── store.ts                    # In-memory store dla dev
│   └── missions-presets.ts         # Predefiniowane misje
├── stores/
│   └── gameStore.ts                # Zustand store (nickname, gameState)
```

### Konfiguracja
```
app/
├── schema.sql                      # Schema bazy D1
├── next.config.ts                  # Konfiguracja Next.js + Cloudflare
├── wrangler.jsonc                  # Konfiguracja Cloudflare Workers
├── package.json                    # Zależności i skrypty
└── tsconfig.json                   # Konfiguracja TypeScript
```

## 🚀 Setup Developer

### Wymagania
- Node.js 20+
- npm
- Cloudflare account (dla produkcji)

### Lokalne uruchomienie

1. **Instalacja zależności**
```bash
cd app/
npm ci
```

2. **Build i preview**
```bash
npm run build:cf
npm run preview
```

3. **Development** (opcjonalne)
```bash
npm run dev  # Wymaga konfiguracji local D1
```

### Skrypty npm

```bash
npm run dev           # Development server (wymaga D1 setup)
npm run build         # Standardowy build Next.js
npm run build:cf      # Build dla Cloudflare Pages
npm run preview       # Preview buildu z Wrangler
npm run deploy        # Deploy do Cloudflare Pages
npm run lint          # ESLint check
npm run typecheck     # TypeScript validation
npm run test          # Uruchomienie testów
npm run format        # Formatowanie kodu
```

## 🔄 CI/CD

### GitHub Actions
Workflow w `.github/workflows/ci.yml`:
1. **Lint**: ESLint validation
2. **Type Check**: TypeScript sprawdzenie typów
3. **Test**: Unit testy z coverage
4. **Build**: Build dla Cloudflare Pages

### Deployment
- **Automatyczny deploy**: Każdy push na `main` triggeruje deploy na Cloudflare Pages
- **Preview deploys**: Pull requesty otrzymują preview URL
- **Środowisko produkcyjne**: [URL production Cloudflare Pages]

## 💾 Database Schema

Kompletny schema znajduje się w [`app/schema.sql`](app/schema.sql).

### Główne tabele:
- **`games`** - Informacje o grach (kod, status, faza, konfiguracja)
- **`players`** - Gracze i ich statystyki globalne
- **`game_players`** - Gracze w konkretnej grze (role, status, token)
- **`game_actions`** - Akcje graczy (głosy, akcje nocne)
- **`messages`** - Wiadomości GM → gracze
- **`missions`** - Misje przypisane graczom

### Kluczowe indeksy:
- Szybkie wyszukiwanie gier po kodzie
- Efektywne queries dla stanu gry
- Optymalizacja dla polling co 2s

## 🧪 Testowanie

### Framework testowy
- **Vitest**: Szybki test runner dla Vite/Next.js
- **Coverage**: @vitest/coverage-v8
- **Environment**: happy-dom dla DOM simulation

### Coverage target
- **Minimum 60% statements coverage**
- **Priorytet**: `db.ts`, `store.ts`, `missions-presets.ts`

### Uruchomienie testów
```bash
npm run test                    # Uruchomienie testów
npm run test -- --coverage     # Z raportem coverage
```

## 📈 Roadmap

### Etap 2 (planowany)
- [ ] Statystyki długoterminowe graczy
- [ ] System odznak i osiągnięć
- [ ] Niestandardowe misje tworzone przez GM
- [ ] Export wyników gier
- [ ] Ulepszone UI/UX

### Etap 3 (rozważany)
- [ ] Multiplayer online (WebSockets)
- [ ] Niestandardowe role
- [ ] Integracje z Discord/Slack
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork projektu
2. Stwórz feature branch (`git checkout -b feature/amazing-feature`)
3. Commit zmian (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

### Code Standards
- **Linting**: ESLint + Prettier
- **Types**: Pełne typowanie TypeScript
- **Tests**: Nowe funkcje wymagają testów
- **Commits**: Conventional Commits preferred

## 📝 Licencja

Ten projekt jest licencjonowany na licencji MIT - zobacz [LICENSE](LICENSE) dla szczegółów.

## 👥 Zespół

- **Projektant/Developer**: [giraffe-horizon](https://github.com/giraffe-horizon)
- **Repo**: [giraffe-horizon/mafia-game](https://github.com/giraffe-horizon/mafia-game)

---

*Mafia Game Helper - Bringing classic party games into the digital age! 🕵️‍♂️*
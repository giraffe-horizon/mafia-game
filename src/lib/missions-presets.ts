export interface MissionPreset {
  description: string;
  points: 1 | 2 | 3;
  category: "easy" | "medium" | "hard";
}

export const MISSION_PRESETS: MissionPreset[] = [
  // Łatwe (1 pkt)
  {
    description: "Powiedz słowo 'mafia' co najmniej 5 razy podczas jednej dyskusji",
    points: 1,
    category: "easy",
  },
  {
    description: "Zadaj co najmniej 3 pytania innym graczom podczas dyskusji",
    points: 1,
    category: "easy",
  },
  {
    description: "Wspomnij o swojej 'alibi' co najmniej raz w trakcie gry",
    points: 1,
    category: "easy",
  },
  {
    description: "Wskaż palcem na kogoś i powiedz 'to podejrzane!' lub podobne",
    points: 1,
    category: "easy",
  },
  {
    description: "Milcz przez całą pierwszą turę dyskusji",
    points: 1,
    category: "easy",
  },
  {
    description: "Uśmiechnij się za każdym razem gdy pada twoje imię",
    points: 1,
    category: "easy",
  },

  // Średnie (2 pkt)
  {
    description: "Przekonaj co najmniej jedną osobę, że jesteś lekarzem",
    points: 2,
    category: "medium",
  },
  {
    description: "Zaproponuj formalny sojusz innemu graczowi",
    points: 2,
    category: "medium",
  },
  {
    description: "Oskarż publicznie niewinną osobę i obstawaj przy swoim przez całą rundę",
    points: 2,
    category: "medium",
  },
  {
    description: "Obroń publicznie gracza, który jest aktywnie podejrzewany przez innych",
    points: 2,
    category: "medium",
  },
  {
    description: "Przekonaj co najmniej 2 osoby, żeby nie głosowały na konkretnego gracza",
    points: 2,
    category: "medium",
  },
  {
    description: "Ujawnij 'fałszywy wynik śledztwa' — twierdź że sprawdziłeś konkretną osobę",
    points: 2,
    category: "medium",
  },
  {
    description: "Zorganizuj grupę śledczą z co najmniej dwoma innymi graczami",
    points: 2,
    category: "medium",
  },

  // Trudne (3 pkt)
  {
    description: "Bądź jedynym oskarżonym w dyskusji i wyjdź z niej bez eliminacji",
    points: 3,
    category: "hard",
  },
  {
    description: "Przekonaj wszystkich, że jesteś policjantem — nie będąc nim",
    points: 3,
    category: "hard",
  },
  {
    description: "Doprowadź do eliminacji konkretnego gracza bez samodzielnego głosowania na niego",
    points: 3,
    category: "hard",
  },
  {
    description: "Nie odzywaj się przez całą dyskusję i przeżyj głosowanie",
    points: 3,
    category: "hard",
  },
  {
    description: "Wywołaj kłótnię między dwoma niewinnymi graczami",
    points: 3,
    category: "hard",
  },
  {
    description: "Zmień zdanie co do głosowania na oczach wszystkich — najpierw na X, potem na Y",
    points: 3,
    category: "hard",
  },
  {
    description: "Użyj dokładnie tych samych słów co poprzedni mówca w swoim wystąpieniu",
    points: 3,
    category: "hard",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  easy: "Łatwa (1 pkt)",
  medium: "Średnia (2 pkt)",
  hard: "Trudna (3 pkt)",
};

export const CATEGORY_COLORS: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

"use client";

import { useState, useCallback } from "react";
import { useClientConfig } from "@/config";

export const dynamic = "force-dynamic";

type SeedStage = "lobby" | "night" | "day" | "voting" | "ended";

interface PlayerInfo {
  nickname: string;
  token: string;
  role: string | null;
}

interface SeedResult {
  stage: SeedStage;
  gameCode: string;
  gmToken: string;
  players: PlayerInfo[];
}

const ROLE_LABELS: Record<string, string> = {
  mafia: "Mafia",
  detective: "Policjant",
  doctor: "Lekarz",
  civilian: "Cywil",
};

const STAGES: SeedStage[] = ["lobby", "night", "day", "voting", "ended"];

export default function DevPage() {
  const [stage, setStage] = useState<SeedStage>("lobby");
  const [players, setPlayers] = useState(5);
  const [mode, setMode] = useState<"full" | "simple">("full");
  const [mafiaCount, setMafiaCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/dev/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          players,
          mode,
          mafiaCount: mafiaCount || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: SeedResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setLoading(false);
    }
  }, [stage, players, mode, mafiaCount]);

  const openAllTabs = useCallback(() => {
    if (!result) return;
    window.open(`/game/${result.gmToken}`, "_blank");
    for (const p of result.players) {
      window.open(`/game/${p.token}`, "_blank");
    }
  }, [result]);

  const { enableDevTools } = useClientConfig();

  if (!enableDevTools) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-dark p-8 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 font-typewriter text-2xl text-primary">Dev Tools — Seed Game</h1>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as SeedStage)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Players (3-12)</label>
            <input
              type="number"
              min={3}
              max={12}
              value={players}
              onChange={(e) => setPlayers(parseInt(e.target.value, 10) || 5)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="full"
                  checked={mode === "full"}
                  onChange={() => setMode("full")}
                />
                <span>Full</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="simple"
                  checked={mode === "simple"}
                  onChange={() => setMode("simple")}
                />
                <span>Simple</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Mafia Count (0 = auto)</label>
            <input
              type="number"
              min={0}
              max={6}
              value={mafiaCount}
              onChange={(e) => setMafiaCount(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white"
            />
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full rounded bg-primary px-4 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Seeding..." : "Seed Game"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded border border-red-700 bg-red-900/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <div className="rounded bg-gray-800 p-4">
              <div className="mb-2 font-typewriter text-lg text-primary">
                Game seeded to: {result.stage}
              </div>
              <div className="text-sm text-gray-400">Code: {result.gameCode}</div>
            </div>

            <div className="rounded bg-gray-800 p-4">
              <div className="mb-2 text-sm font-bold text-gray-400">GM</div>
              <a
                href={`/game/${result.gmToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Open GM Panel
              </a>
            </div>

            <div className="rounded bg-gray-800 p-4">
              <div className="mb-2 text-sm font-bold text-gray-400">Players</div>
              <ul className="space-y-1">
                {result.players.map((p) => (
                  <li key={p.token} className="flex items-center justify-between">
                    <span>
                      {p.nickname}{" "}
                      <span className="text-sm text-gray-500">
                        ({p.role ? ROLE_LABELS[p.role] || p.role : "—"})
                      </span>
                    </span>
                    <a
                      href={`/game/${p.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={openAllTabs}
              className="w-full rounded border border-primary bg-transparent px-4 py-2 text-primary transition-colors hover:bg-primary/10"
            >
              Open All in Tabs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Game error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 max-w-lg w-full text-center border border-slate-700">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-xl font-bold text-white mb-2">Błąd w grze</h2>
          <p className="text-slate-300 mb-4">
            Wystąpił problem z grą Mafia. Może to być problem z połączeniem lub nieważny token gry.
          </p>
          <details className="text-left bg-slate-900 p-3 rounded border border-slate-600">
            <summary className="text-sm text-slate-400 cursor-pointer">Szczegóły błędu</summary>
            <p className="text-xs text-red-400 mt-2 font-mono">{error.message}</p>
          </details>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Spróbuj ponownie
          </button>

          <a
            href="/"
            className="block w-full bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Powrót do strony głównej
          </a>
        </div>
      </div>
    </div>
  );
}

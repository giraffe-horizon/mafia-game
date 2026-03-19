"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center border border-slate-700">
        <div className="mb-6">
          <span className="material-symbols-outlined text-[56px] text-primary mb-4 block">
            warning
          </span>
          <h2 className="text-xl font-bold text-white mb-2">Coś poszło nie tak!</h2>
          <p className="text-slate-300">Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.</p>
        </div>

        <Button onClick={reset} variant="secondary" className="mx-auto">
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
}

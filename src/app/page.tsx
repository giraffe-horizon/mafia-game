import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="relative z-20 flex items-center p-4 pb-2 justify-between border-b border-surface-highest">
        <div className="size-12 shrink-0 opacity-0 pointer-events-none" />
        <h2 className="text-lg font-bold leading-tight tracking-widest flex-1 text-center font-display text-stamp uppercase">
          MAFIA
        </h2>
        <div className="size-12 shrink-0" />
      </div>

      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        {/* Dossier hero */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 border-2 border-stamp/40 flex items-center justify-center bg-surface-low relative overflow-hidden">
            <div className="absolute inset-0 bg-stamp/5" />
            <span className="material-symbols-outlined text-[64px] text-stamp relative z-10">
              local_police
            </span>
          </div>
        </div>

        {/* Dossier heading */}
        <div className="mb-8 text-center">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-on-surface/40 mb-1">
            AKTA TAJNE — OPERACJA:
          </p>
          <h1 className="font-display font-black text-[40px] leading-none text-stamp uppercase tracking-wider">
            [REDACTED]
          </h1>
          <p className="font-display text-xs uppercase tracking-widest text-on-surface/30 mt-2">
            Klasyfikacja: ŚCIŚLE TAJNE
          </p>
        </div>

        {/* Client interactive content */}
        <HomeClient />
      </div>
    </div>
  );
}

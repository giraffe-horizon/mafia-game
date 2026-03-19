import HomeClient from "./_components/HomeClient";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background overflow-hidden">
      {/* Desk surface texture */}
      <div className="absolute inset-0 z-0 grain" />

      {/* Atmospheric vignette */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-radial-[ellipse_at_50%_30%] from-stamp/5 via-transparent to-transparent" />
      </div>

      {/* Top classification bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-on-surface/8">
        <span className="text-on-surface/20 font-display text-[9px] uppercase tracking-widest">
          Dok. nr: MFG-001
        </span>
        <span className="stamp stamp-red text-[9px] py-0 px-1.5">ŚCIŚLE TAJNE</span>
        <span className="text-on-surface/20 font-display text-[9px] uppercase tracking-widest">
          OPERACJA
        </span>
      </div>

      {/* Main dossier card */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-8 pb-8">
        {/* Header dossier block */}
        <div className="border border-on-surface/15 bg-surface-low p-5 mb-6 tape-corner">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-on-surface/30 font-display font-bold uppercase tracking-widest text-[10px] mb-1">
                Nazwa operacji
              </p>
              <h1 className="font-display font-bold text-[40px] leading-none uppercase tracking-wider text-stamp">
                MAFIA
              </h1>
              <p className="text-on-surface/40 font-display text-xs uppercase tracking-widest mt-1">
                System zarządzania rozgrywką
              </p>
            </div>
            <div className="shrink-0 w-16 h-16 border border-on-surface/20 flex items-center justify-center bg-background">
              <span className="material-symbols-outlined text-[32px] text-on-surface/30">
                skull
              </span>
            </div>
          </div>

          {/* Redacted field */}
          <div className="mt-4 pt-3 border-t border-on-surface/8">
            <p className="text-on-surface/20 font-display text-[9px] uppercase tracking-widest mb-1">
              Kod dostępu
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`redact-${i}`}
                  className="redacted w-6 h-4 font-display text-[10px]"
                  aria-hidden="true"
                >
                  X
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive section */}
        <HomeClient />
      </div>
    </div>
  );
}

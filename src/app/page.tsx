import HomeClient from "@/components/HomeClient";
import { Stamp } from "@/components/ui";

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
        {/* Dossier hero card */}
        <div className="paper-card flex flex-col items-center mb-8 p-6 border-2 border-stamp/30 relative overflow-hidden bg-gradient-to-br from-paper via-paper to-paper-dim shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Stamp overlay */}
          <div className="absolute top-2 right-2">
            <Stamp
              color="red"
              rotate={12}
              className="text-[12px] px-3 py-1 border-[3px] opacity-95"
            >
              ŚCIŚLE TAJNE
            </Stamp>
          </div>

          {/* Skull icon */}
          <span className="material-symbols-outlined text-[96px] text-stamp mb-4 drop-shadow-[0_0_24px_rgba(255,180,172,0.6)] filter brightness-110">
            skull
          </span>

          {/* Title */}
          <h1 className="font-display font-black text-[48px] leading-none text-on-paper uppercase tracking-wider mb-2 drop-shadow-[0_2px_4px_rgba(26,26,26,0.3)]">
            MAFIA
          </h1>

          {/* Redacted op line */}
          <p className="font-display text-[10px] uppercase tracking-[0.25em] text-on-paper/50">
            OPERACJA:{" "}
            <span className="bg-on-paper text-transparent select-none px-0.5">████████</span> 1954
          </p>
        </div>

        {/* Client interactive content */}
        <HomeClient />

        {/* Classified footer */}
        <p className="font-display text-[9px] uppercase tracking-[0.2em] text-on-surface/20 text-center mt-6">
          ODDZIAŁ KONTRWYWIADU // DOKUMENT NR X-ALPHA
        </p>
      </div>
    </div>
  );
}

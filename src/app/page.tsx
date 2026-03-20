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

      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pt-8 pb-8">
        {/* Dossier hero card */}
        <div
          className="flex-1 flex flex-col items-center mx-0 p-10 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          style={{
            background:
              "linear-gradient(160deg, #5E8F6D 0%, #8BA87A 15%, #B5B478 30%, #CBBC7A 45%, #D4B06E 55%, #D49E68 70%, #D48E5C 85%, #D08558 100%)",
            borderRadius: "16px",
            margin: "0 24px",
            padding: "40px 28px",
          }}
        >
          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.15) 100%)",
              borderRadius: "16px",
            }}
          ></div>
          {/* Stamp overlay */}
          <div className="absolute top-4 right-4 z-10">
            <div
              className="font-display font-bold uppercase px-4 py-2 border-[3px] opacity-85 text-[22px]"
              style={{
                color: "#E09090",
                borderColor: "#E09090",
                transform: "rotate(-15deg)",
              }}
            >
              ŚCIŚLE TAJNE
            </div>
          </div>

          {/* Skull icon */}
          <span
            className="material-symbols-outlined text-[120px] mb-4 relative z-10"
            style={{
              color: "#D94F3B",
              filter: "drop-shadow(0 0 16px rgba(217,79,59,0.4))",
            }}
          >
            skull
          </span>

          {/* Title */}
          <h1
            className="font-display font-black text-[52px] leading-none uppercase mb-2 relative z-10"
            style={{
              color: "#2B2B2B",
              letterSpacing: "4px",
              fontWeight: 900,
            }}
          >
            MAFIA
          </h1>

          {/* Redacted op line */}
          <p
            className="font-display text-[14px] uppercase tracking-[0.25em] relative z-10 mb-6"
            style={{ color: "#6B6B5A" }}
          >
            OPERACJA:{" "}
            <span className="bg-on-paper text-transparent select-none px-0.5">████████</span> 1954
          </p>

          {/* Client interactive content - now INSIDE the card */}
          <div className="relative z-10 w-full flex-1 flex flex-col">
            <HomeClient />
          </div>
        </div>

        {/* Classified footer - outside card */}
        <p
          className="font-display text-[8px] uppercase tracking-[0.2em] text-center mt-4"
          style={{ color: "#7A7A6A" }}
        >
          ODDZIAŁ KONTRWYWIADU // DOKUMENT NR X-ALPHA
        </p>
      </div>
    </div>
  );
}

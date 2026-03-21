import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div
      className="relative flex min-h-[100dvh] w-full md:max-w-lg flex-col overflow-y-auto grain"
      style={{
        background:
          "linear-gradient(160deg, #5E8F6D 0%, #8BA87A 15%, #B5B478 30%, #CBBC7A 45%, #D4B06E 55%, #D49E68 70%, #D48E5C 85%, #D08558 100%)",
      }}
    >
      {/* Vignette na cały ekran */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Top bar — przezroczysty na gradient tle */}
      <div
        className="relative z-20 flex items-center p-4 pb-2 justify-between"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
      >
        <div className="size-12 shrink-0 opacity-0 pointer-events-none" />
        <h2
          className="text-lg font-bold leading-tight tracking-widest flex-1 text-center font-display uppercase"
          style={{ color: "#2B2B2B" }}
        >
          MAFIA
        </h2>
        <div className="size-12 shrink-0" />
      </div>

      {/* Main content — flex-1, justify-start, content od góry */}
      <div className="relative z-20 flex-1 flex flex-col items-center px-6 pt-4 pb-6">
        {/* Pieczątka — wycentrowana nad czaszką, nie nachodzi na MAFIA */}
        <div className="z-30" style={{ transform: "rotate(-12deg)", marginBottom: "-10px" }}>
          <div
            className="font-display font-bold uppercase px-4 py-1.5 border-[3px]"
            style={{
              color: "rgba(224, 144, 144, 0.75)",
              borderColor: "rgba(224, 144, 144, 0.75)",
              fontSize: "14px",
              letterSpacing: "0.15em",
              whiteSpace: "nowrap",
            }}
          >
            ŚCIŚLE TAJNE
          </div>
        </div>

        {/* Czaszka — zmniejszona z 100px na 72px */}
        <span
          className="material-symbols-outlined mb-3"
          style={{
            fontSize: "72px",
            lineHeight: 1,
            color: "#D94F3B",
            filter: "drop-shadow(0 0 20px rgba(217,79,59,0.4))",
          }}
        >
          skull
        </span>

        {/* Tytuł MAFIA — zmniejszony z 52px na 40px */}
        <h1
          className="font-display font-black leading-none uppercase mb-2"
          style={{ color: "#2B2B2B", fontSize: "40px", letterSpacing: "4px" }}
        >
          MAFIA
        </h1>

        {/* OPERACJA line — zmniejszony mb z 6 na 4 */}
        <p
          className="font-display text-[14px] uppercase mb-4"
          style={{ color: "#6B6B5A", letterSpacing: "0.25em" }}
        >
          OPERACJA:{" "}
          <span
            style={{
              backgroundColor: "#2B2B2B",
              color: "transparent",
              userSelect: "none",
              padding: "0 2px",
            }}
          >
            ████████
          </span>{" "}
          1954
        </p>

        {/* HomeClient — przyciski WEWNĄTRZ gradientu */}
        <div className="w-full">
          <HomeClient />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 pb-4">
        <p
          className="font-display text-[8px] uppercase text-center"
          style={{ color: "#8A8A7A", letterSpacing: "0.2em" }}
        >
          ODDZIAŁ KONTRWYWIADU // DOKUMENT NR X-ALPHA
        </p>
      </div>
    </div>
  );
}

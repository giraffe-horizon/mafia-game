import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div
      className="relative flex min-h-screen w-full md:max-w-lg flex-col overflow-hidden grain"
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
      <div className="relative z-20 flex-1 flex flex-col items-center px-8 pt-8 pb-6">
        {/* Pieczątka — wycentrowana nad czaszką, nie nachodzi na MAFIA */}
        <div className="z-30" style={{ transform: "rotate(-12deg)", marginBottom: "-20px" }}>
          <div
            className="font-display font-bold uppercase px-5 py-2 border-[3px]"
            style={{
              color: "rgba(224, 144, 144, 0.75)",
              borderColor: "rgba(224, 144, 144, 0.75)",
              fontSize: "18px",
              letterSpacing: "0.15em",
              whiteSpace: "nowrap",
            }}
          >
            ŚCIŚLE TAJNE
          </div>
        </div>

        {/* Czaszka — DUŻA, 100px */}
        <span
          className="material-symbols-outlined mb-3"
          style={{
            fontSize: "100px",
            lineHeight: 1,
            color: "#D94F3B",
            filter: "drop-shadow(0 0 20px rgba(217,79,59,0.4))",
          }}
        >
          skull
        </span>

        {/* Tytuł MAFIA — ciemny na jasnym tle */}
        <h1
          className="font-display font-black leading-none uppercase mb-2"
          style={{ color: "#2B2B2B", fontSize: "52px", letterSpacing: "4px" }}
        >
          MAFIA
        </h1>

        {/* OPERACJA line */}
        <p
          className="font-display text-[14px] uppercase mb-6"
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
          style={{ color: "#5A5A4A", letterSpacing: "0.2em" }}
        >
          ODDZIAŁ KONTRWYWIADU // DOKUMENT NR X-ALPHA
        </p>
      </div>
    </div>
  );
}

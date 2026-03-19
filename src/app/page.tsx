import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-light dark:bg-background-dark group overflow-hidden">
      {/* Noir atmospheric background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/40 via-background-dark/70 to-background-dark z-10" />
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 30%, rgba(218,11,11,0.15) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(50,0,0,0.8) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center p-4 pb-2 justify-between">
        <div className="size-12 shrink-0 opacity-0 pointer-events-none" />
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-typewriter text-primary drop-shadow-[0_0_8px_rgba(218,11,11,0.5)]">
          MAFIA
        </h2>
        <div className="size-12 shrink-0" />
      </div>

      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        {/* Hero icon */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background-dark/80 shadow-[0_0_30px_rgba(218,11,11,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            <span className="material-symbols-outlined text-[64px] text-primary relative z-10 drop-shadow-md">
              local_police
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-white tracking-tight text-[40px] font-bold leading-none text-center pb-8 font-typewriter drop-shadow-md uppercase">
          Witamy w
          <br />
          <span className="text-primary text-[48px] drop-shadow-[0_0_12px_rgba(218,11,11,0.6)]">
            Mieście
          </span>
        </h1>

        {/* Client interactive content */}
        <HomeClient />
      </div>
    </div>
  );
}

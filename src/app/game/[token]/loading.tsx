export default function Loading() {
  return (
    <div className="flex min-h-screen w-full md:max-w-lg flex-col items-center justify-center bg-background-dark">
      <span className="material-symbols-outlined text-[40px] text-primary animate-spin mb-4">
        refresh
      </span>
      <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
        Ładowanie...
      </p>
    </div>
  );
}

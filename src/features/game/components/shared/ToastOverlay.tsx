import { useGameStore } from "@/features/game/store/gameStore";

export default function ToastOverlay() {
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-14 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-surface-low border border-primary/40 px-3 py-2.5 shadow-lg pointer-events-auto"
        >
          {/* DEPESZA header */}
          <div className="flex items-center gap-1 mb-1">
            <span className="font-display font-black text-[9px] uppercase tracking-widest text-primary">
              ▶ Depesza tajna
            </span>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-auto text-on-surface/30 hover:text-on-surface/60"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          <p className="font-display text-sm text-on-surface">{t.content}</p>
        </div>
      ))}
    </div>
  );
}

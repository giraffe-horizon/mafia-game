import { useGameStore } from "@/features/game/store/gameStore";

export default function ToastOverlay() {
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-[60] flex flex-col gap-2 px-4 pointer-events-none md:max-w-lg md:mx-auto">
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className="bg-secondary text-on-secondary px-3 py-2.5 shadow-lg pointer-events-auto"
          style={{ transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)` }}
        >
          <div className="flex items-start gap-2">
            <div className="flex flex-col flex-1">
              <span className="font-display font-black text-[9px] uppercase tracking-[0.2em] text-on-secondary/50 mb-0.5">
                Depesza tajna
              </span>
              <p className="font-display text-xs text-on-secondary leading-snug">{t.content}</p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-on-secondary/40 hover:text-on-secondary mt-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

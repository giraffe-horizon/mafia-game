import { useGameStore } from "../_stores/gameStore";

export default function ToastOverlay() {
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-16 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="bg-surface-low border border-stamp/30 pointer-events-auto">
          {/* DEPESZA header strip */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-stamp/20 bg-stamp/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[12px] text-stamp/70">mail</span>
              <span className="font-display font-bold uppercase tracking-widest text-[9px] text-stamp/70">
                Depesza tajna
              </span>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-on-surface/30 hover:text-on-surface/70"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          {/* Message content */}
          <div className="px-3 py-2.5">
            <p className="text-on-surface text-sm font-display">{t.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

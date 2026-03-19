import { useGameStore } from "@/stores/game/gameStore";

export default function ToastOverlay() {
  // Get data from store
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-16 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-slate-900 border border-primary/30 rounded-xl px-4 py-3 shadow-lg pointer-events-auto"
        >
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">
              mail
            </span>
            <p className="text-white text-sm font-typewriter">{t.content}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-auto shrink-0 text-slate-500 hover:text-slate-300"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useGameStore } from "@/features/game/store/gameStore";
import { cn } from "@/lib/cn";

export default function ToastOverlay() {
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  if (toasts.length === 0) return null;

  const handleToastClick = (toast: (typeof toasts)[number]) => {
    if (toast.action) {
      setActiveTab(toast.action.tab as "night" | "day" | "archive" | "agents");
      dismissToast(toast.id);
    }
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-[60] flex flex-col gap-2 px-4 pointer-events-none md:max-w-lg md:mx-auto">
      {toasts.map((t, i) => {
        const isMission = t.variant === "mission";
        return (
          <div
            key={t.id}
            className={cn(
              "shadow-xl pointer-events-auto",
              isMission
                ? "bg-background border border-primary px-3 py-2.5"
                : "bg-secondary text-on-secondary px-3 py-2.5"
            )}
            style={{ transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)` }}
            onClick={() => handleToastClick(t)}
            role={t.action ? "button" : undefined}
          >
            <div className="flex items-start gap-2">
              {t.icon && (
                <span
                  className={cn(
                    "material-symbols-outlined text-[18px] mt-0.5 shrink-0",
                    isMission ? "text-primary" : "text-on-secondary/60"
                  )}
                >
                  {t.icon}
                </span>
              )}
              <div className="flex flex-col flex-1">
                <span
                  className={cn(
                    "font-display font-black text-[9px] uppercase tracking-[0.2em] mb-0.5",
                    isMission ? "text-primary/60" : "text-on-secondary/50"
                  )}
                >
                  {isMission ? "Nowa misja" : "Depesza tajna"}
                </span>
                <p
                  className={cn(
                    "font-display text-xs leading-snug",
                    isMission ? "text-on-surface" : "text-on-secondary"
                  )}
                >
                  {t.content}
                </p>
              </div>
              {t.action && (
                <span className="shrink-0 font-display font-black text-[10px] uppercase tracking-wider text-primary mt-1.5">
                  {t.action.label}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(t.id);
                }}
                className={cn(
                  "shrink-0 mt-0.5",
                  isMission
                    ? "text-on-surface/40 hover:text-on-surface"
                    : "text-on-secondary/40 hover:text-on-secondary"
                )}
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

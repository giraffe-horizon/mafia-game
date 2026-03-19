import React from "react";
import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  icon: string;
  label: string;
}

interface TabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  position?: "top" | "bottom";
}

// "Analog Intelligence Dossier" tab bar
// bottom position: fixed bottom nav with 4 tabs (NOC/DZIEŃ/GŁOSY/LOGI)
// Active tab: salmon/stamp highlight
export default function TabBar({
  tabs,
  activeTab,
  onTabChange,
  position = "bottom",
  className,
  ...props
}: TabBarProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex overflow-x-auto bg-surface-lowest border-t border-on-surface/10",
        position === "bottom" && "fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto w-full",
        className
      )}
      {...props}
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(t.id)}
            className={cn(
              "flex-1 min-w-0 flex flex-col items-center py-3 gap-1 text-[10px] font-display font-bold uppercase tracking-widest whitespace-nowrap min-h-[56px] touch-manipulation",
              isActive
                ? "text-stamp border-t-2 border-stamp bg-stamp/5"
                : "text-on-surface/40 hover:text-on-surface/70 border-t-2 border-transparent"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export type { TabBarProps, Tab };

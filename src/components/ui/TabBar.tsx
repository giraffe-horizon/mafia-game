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
}

export default function TabBar({ tabs, activeTab, onTabChange, className, ...props }: TabBarProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex border-t border-surface-highest bg-surface-low",
        className
      )}
      {...props}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => onTabChange(t.id)}
          className={cn(
            "flex-1 min-w-0 flex flex-col items-center py-2.5 gap-0.5 text-[9px] font-display font-black uppercase tracking-widest whitespace-nowrap transition-colors",
            activeTab === t.id
              ? "text-primary bg-surface-lowest border-t-2 border-t-primary"
              : "text-on-surface/40 hover:text-on-surface/70"
          )}
        >
          <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export type { TabBarProps, Tab };

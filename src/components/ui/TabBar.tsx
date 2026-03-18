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
    <div className={cn("flex border-b border-slate-800 overflow-x-auto", className)} {...props}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={cn(
            "flex-1 min-w-0 flex flex-col items-center py-2 gap-0.5 transition-colors text-[10px] font-typewriter uppercase tracking-wider whitespace-nowrap",
            activeTab === t.id
              ? "text-primary border-b-2 border-primary"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export type { TabBarProps, Tab };

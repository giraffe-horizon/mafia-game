import { cn } from "@/lib/cn";

export interface Tab {
  id: string;
  label: string;
  icon: string;
}

export interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <nav
      role="tablist"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-surface-lowest border-t border-on-surface/10",
        "flex items-stretch",
        "max-w-lg mx-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5",
              "py-2 px-1 min-h-[56px]",
              "font-display text-[9px] font-bold uppercase tracking-widest",
              "transition-colors duration-[0.1s]",
              "border-0 outline-none",
              isActive
                ? "text-stamp border-t-2 border-t-stamp"
                : "text-on-surface/40 border-t-2 border-t-transparent hover:text-on-surface/70"
            )}
          >
            <span className="material-symbols-outlined text-[20px] leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default TabBar;

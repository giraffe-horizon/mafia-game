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
  notifications?: Record<string, boolean>;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, notifications, className }: TabBarProps) {
  return (
    <nav
      role="tablist"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "flex items-stretch",
        "max-w-lg mx-auto",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
      style={{
        backgroundColor: "rgba(28, 28, 28, 0.95)",
        borderTop: "1px solid #333333",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const hasNotification = notifications?.[tab.id] === true;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 relative",
              "min-h-[48px]",
              "font-display text-[9px] font-bold uppercase tracking-widest",
              "transition-colors duration-[0.1s]",
              "border-0 outline-none"
            )}
            style={
              isActive
                ? {
                    color: "#F0B8AE",
                    backgroundColor: "#333333",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    margin: "4px",
                  }
                : {
                    color: "#888888",
                    backgroundColor: "transparent",
                    padding: "8px 16px",
                    margin: "4px",
                  }
            }
          >
            <div className="relative">
              <span className="material-symbols-outlined text-[20px] leading-none">{tab.icon}</span>
              {hasNotification && !isActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-surface animate-pulse" />
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default TabBar;

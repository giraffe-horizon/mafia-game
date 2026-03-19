import React from "react";
import { cn } from "@/lib/cn";

interface GameLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GameLayout({ children, className, ...props }: GameLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full md:max-w-lg flex-col bg-background-dark overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Background effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export { default as PageLayout } from "@/components/ui/GameLayout";
export type { GameLayoutProps };

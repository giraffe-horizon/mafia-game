import React from "react";
import { cn } from "@/lib/cn";

interface GameLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GameLayout({ children, className, ...props }: GameLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full md:max-w-lg flex-col bg-background overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export { default as PageLayout } from "@/components/ui/GameLayout";
export type { GameLayoutProps };

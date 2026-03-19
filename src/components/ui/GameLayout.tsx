import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface GameLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GameLayout({ children, className, ...props }: GameLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-stretch",
        "max-w-lg mx-auto w-full min-h-screen",
        "bg-background text-on-surface",
        "overflow-hidden grain",
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export { default as PageLayout } from "@/components/ui/GameLayout";

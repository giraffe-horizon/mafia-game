import React from "react";
import { cn } from "@/lib/cn";

interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function ActionBar({ children, className, ...props }: ActionBarProps) {
  return (
    <div className={cn("mx-5 mt-4", className)} {...props}>
      {children}
    </div>
  );
}

export type { ActionBarProps };

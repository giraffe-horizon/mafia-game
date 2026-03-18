import React from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mafia" | "detective" | "doctor" | "civilian" | "success" | "warning" | "danger";
  children: React.ReactNode;
}

const badgeVariants = {
  mafia: "text-red-400 border-red-900/50 bg-red-950/30",
  detective: "text-blue-400 border-blue-900/50 bg-blue-950/30",
  doctor: "text-green-400 border-green-900/50 bg-green-950/30",
  civilian: "text-slate-400 border-slate-700 bg-slate-900/30",
  success: "text-green-400 border-green-900/50 bg-green-950/30",
  warning: "text-yellow-400 border-yellow-900/50 bg-yellow-950/30",
  danger: "text-red-400 border-red-900/50 bg-red-950/30",
};

export default function Badge({ variant = "civilian", children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        "text-xs font-typewriter font-bold uppercase px-2 py-1 rounded border",
        // Variant styles
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type { BadgeProps };

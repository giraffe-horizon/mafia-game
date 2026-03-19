import React from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mafia" | "detective" | "doctor" | "civilian" | "success" | "warning" | "danger";
  children: React.ReactNode;
}

const badgeVariants = {
  mafia: "text-primary-dark border-primary-dark bg-primary-dark/10",
  detective: "text-blue-400 border-blue-700 bg-blue-950/30",
  doctor: "text-green-400 border-green-700 bg-green-950/30",
  civilian: "text-on-surface/60 border-on-surface/30 bg-surface-highest/20",
  success: "text-green-400 border-green-700 bg-green-950/30",
  warning: "text-yellow-400 border-yellow-700 bg-yellow-950/30",
  danger: "text-primary-dark border-primary-dark bg-primary-dark/10",
};

export default function Badge({ variant = "civilian", children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Stamp style: sharp border, all caps, tiny text
        "inline-block text-[10px] font-display font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-none",
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

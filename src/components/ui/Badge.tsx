import React from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mafia" | "detective" | "doctor" | "civilian" | "success" | "warning" | "danger";
  children: React.ReactNode;
}

// Stamp-style badge: rectangular border, no rounded corners, ALL CAPS
const badgeVariants = {
  mafia: "text-stamp border-stamp/80 bg-transparent",
  detective: "text-blue-300 border-blue-400/60 bg-transparent",
  doctor: "text-green-300 border-green-400/60 bg-transparent",
  civilian: "text-on-surface/70 border-on-surface/40 bg-transparent",
  success: "text-green-300 border-green-400/60 bg-transparent",
  warning: "text-yellow-300 border-yellow-400/60 bg-transparent",
  danger: "text-stamp border-stamp/80 bg-transparent",
};

export default function Badge({ variant = "civilian", children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Rectangular stamp style — no border-radius
        "text-xs font-display font-bold uppercase tracking-wider px-2 py-0.5 border",
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

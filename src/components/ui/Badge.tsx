import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "mafia"
    | "detective"
    | "doctor"
    | "civilian"
    | "success"
    | "warning"
    | "danger"
    | "paper";
  rotated?: boolean;
}

export function Badge({
  variant = "default",
  rotated = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Stamp style — rectangular, uppercase, monospace
        "inline-block font-display font-bold text-xs uppercase tracking-widest",
        "border px-2 py-0.5",
        rotated && "-rotate-1",
        variant === "default" && "border-on-surface/40 text-on-surface",
        variant === "paper" && "border-on-paper/40 text-on-paper",
        variant === "mafia" && "border-stamp text-stamp",
        variant === "detective" && "border-stamp-blue text-stamp-blue",
        variant === "doctor" && "border-stamp-green text-stamp-green",
        variant === "civilian" && "border-on-surface-dim text-on-surface-dim",
        variant === "success" && "border-stamp-green text-stamp-green",
        variant === "warning" && "border-stamp-gold text-stamp-gold",
        variant === "danger" && "border-stamp text-stamp",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

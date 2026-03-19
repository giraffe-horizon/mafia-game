import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StampProps {
  label?: string;
  children?: ReactNode;
  variant?: "classified" | "occupied" | "secret" | "approved" | "rejected" | "custom";
  color?: "red" | "green" | "gold" | "default";
  rotation?: number;
  rotate?: number;
  className?: string;
}

export function Stamp({
  label,
  children,
  color = "red",
  rotation,
  rotate = -2,
  className,
}: StampProps) {
  const deg = rotation ?? rotate;
  return (
    <span
      className={cn(
        "inline-block font-display font-black text-xs uppercase tracking-[0.2em]",
        "border-2 px-2 py-0.5",
        "select-none pointer-events-none",
        color === "red" && "text-stamp border-stamp",
        color === "green" && "text-stamp-green border-stamp-green",
        color === "gold" && "text-stamp-gold border-stamp-gold",
        color === "default" && "text-on-surface border-on-surface",
        className
      )}
      style={{ transform: `rotate(${deg}deg)`, display: "inline-block" }}
    >
      {children ?? label}
    </span>
  );
}

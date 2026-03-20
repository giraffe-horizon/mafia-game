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

const variantColorMap: Partial<
  Record<NonNullable<StampProps["variant"]>, NonNullable<StampProps["color"]>>
> = {
  classified: "red",
  occupied: "red",
  secret: "gold",
  approved: "green",
  rejected: "red",
  custom: "default",
};

export function Stamp({
  label,
  children,
  variant,
  color,
  rotation,
  rotate = -2,
  className,
}: StampProps) {
  const effectiveColor: NonNullable<StampProps["color"]> =
    color ?? (variant != null ? (variantColorMap[variant] ?? "red") : "red");
  const deg = rotation ?? rotate;
  return (
    <span
      className={cn(
        "inline-block font-display font-black text-xs uppercase tracking-[0.2em]",
        "border-2 px-2 py-0.5",
        "select-none pointer-events-none",
        effectiveColor === "red" && "text-stamp border-stamp",
        effectiveColor === "green" && "text-stamp-green border-stamp-green",
        effectiveColor === "gold" && "text-stamp-gold border-stamp-gold",
        effectiveColor === "default" && "text-on-surface border-on-surface",
        className
      )}
      style={{ transform: `rotate(${deg}deg)`, display: "inline-block" }}
    >
      {children ?? label}
    </span>
  );
}

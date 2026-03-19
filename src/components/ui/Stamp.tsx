import React from "react";
import { cn } from "@/lib/cn";

interface StampProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "classified" | "occupied" | "secret" | "approved" | "rejected";
  rotate?: number; // degrees, default depends on variant
  children: React.ReactNode;
}

// Pre-defined stamp labels in Polish (per design)
const STAMP_LABELS: Record<string, string> = {
  classified: "TAJNE",
  occupied: "ZAJĘTE",
  secret: "ZASTRZEŻONE",
  approved: "ZATWIERDZONE",
  rejected: "ODRZUCONE",
};

// Color mapping per variant
const stampVariants = {
  classified: "text-stamp border-stamp",
  occupied: "text-stamp border-stamp",
  secret: "text-stamp border-stamp",
  approved: "text-green-400 border-green-400",
  rejected: "text-on-surface/60 border-on-surface/60",
};

const defaultRotation: Record<string, number> = {
  classified: -2,
  occupied: 3,
  secret: -1.5,
  approved: 2,
  rejected: -3,
};

export default function Stamp({
  variant = "classified",
  rotate,
  children,
  className,
  style,
  ...props
}: StampProps) {
  const deg = rotate ?? defaultRotation[variant] ?? -2;
  const label = children ?? STAMP_LABELS[variant] ?? variant.toUpperCase();

  return (
    <span
      className={cn(
        // Rectangular border, all caps, bold, typewriter spacing
        "inline-block border-2 px-2 py-0.5 font-display font-black uppercase tracking-widest text-xs select-none",
        stampVariants[variant],
        className
      )}
      style={{ transform: `rotate(${deg}deg)`, ...style }}
      {...props}
    >
      {label}
    </span>
  );
}

export type { StampProps };

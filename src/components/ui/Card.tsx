import React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlighted" | "danger";
  children: React.ReactNode;
}

// "Dossier Sheet" card style — no dividers, no rounded corners
// default = paper (pergamin) surface
// highlighted = paper with stamp accent border
// danger = dark folder surface with stamp outline
const cardVariants = {
  default: "bg-paper text-on-paper",
  highlighted: "bg-paper text-on-paper border-l-4 border-stamp",
  danger: "bg-surface-low text-on-surface border-l-4 border-stamp/70",
};

export default function Card({ variant = "default", children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base: no border-radius, generous padding (document margins)
        "p-4",
        // Variant styles
        cardVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type { CardProps };

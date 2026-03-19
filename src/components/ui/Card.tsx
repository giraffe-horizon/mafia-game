import React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlighted" | "danger" | "paper";
  children: React.ReactNode;
}

const cardVariants = {
  // Dark folder card
  default: "bg-surface-low border border-surface-highest/60",
  // Highlighted — subtle primary accent
  highlighted: "bg-surface-low border border-primary/30",
  // Danger — red outline
  danger: "bg-surface-low border border-primary-dark/40",
  // Paper dossier sheet (light)
  paper: "bg-secondary text-on-secondary border border-secondary-dim",
};

export default function Card({ variant = "default", children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base: no rounded corners (paper has sharp edges)
        "rounded-none p-4",
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

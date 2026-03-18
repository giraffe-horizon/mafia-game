import React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlighted" | "danger";
  children: React.ReactNode;
}

const cardVariants = {
  default: "bg-black/40 border border-slate-700",
  highlighted: "bg-black/60 border border-primary/20 hover:border-primary/40",
  danger: "bg-black/40 border border-red-900/40",
};

export default function Card({ variant = "default", children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base styles
        "rounded-xl p-4",
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

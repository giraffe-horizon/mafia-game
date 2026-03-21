import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "paper" | "highlighted" | "danger" | "crt";
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base — no border-radius, depth by layering
        "p-4",
        variant === "default" && "bg-surface-low text-on-surface",
        variant === "paper" && "bg-paper text-on-paper",
        variant === "highlighted" && "bg-surface-low border-l-2 border-stamp text-on-surface",
        variant === "danger" && "bg-surface-low border-l-2 border-stamp text-on-surface",
        variant === "crt" && "bg-accent-green border border-accent-green-bright text-stamp-green",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

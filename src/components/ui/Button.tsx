import React from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string; // material symbols icon name
  children: React.ReactNode;
}

const buttonVariants = {
  // Primary = coral rubber stamp fill
  primary:
    "bg-primary text-on-secondary hover:bg-primary/90 font-black",
  // Secondary = dashed border, transparent
  secondary:
    "bg-transparent border-2 border-dashed border-on-surface/40 text-on-surface hover:border-on-surface hover:bg-surface-highest/30",
  // Danger = muted red
  danger:
    "bg-transparent border-2 border-dashed border-primary-dark/60 text-primary-dark hover:bg-primary-dark/10",
  // Ghost = underline only
  ghost:
    "bg-transparent text-on-surface/60 hover:text-on-surface underline underline-offset-2 decoration-dotted",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        // Base: sharp corners, uppercase, typewriter
        "flex items-center justify-center gap-2 rounded-none font-display font-bold uppercase tracking-wider active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-colors",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export type { ButtonProps };

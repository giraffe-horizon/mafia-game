import React from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string; // material symbols icon name
  children: React.ReactNode;
}

// "Analog Intelligence Dossier" button style
// Primary = rubber stamp (salmon fill, sharp corners)
// Secondary = dashed border, no fill
// Danger = red outlined
// Ghost = underlined text, no border
const buttonVariants = {
  primary:
    "bg-stamp text-on-paper border-2 border-stamp hover:bg-primary-dark hover:border-primary-dark",
  secondary:
    "bg-transparent text-on-surface border-2 border-dashed border-on-surface/60 hover:border-on-surface",
  danger: "bg-transparent text-stamp border-2 border-stamp/70 hover:border-stamp hover:bg-stamp/10",
  ghost: "bg-transparent text-on-surface underline underline-offset-4 border-0 hover:text-stamp",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-14 px-6 text-base",
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
        // Base: sharp corners, all-caps, typewriter font, step transitions
        "flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
        // Variant styles
        buttonVariants[variant],
        // Size styles
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export type { ButtonProps };

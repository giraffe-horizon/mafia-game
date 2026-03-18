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
  primary:
    "bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_0_rgba(218,11,11,0.39)] hover:shadow-[0_6px_20px_rgba(218,11,11,0.23)]",
  secondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
  danger: "bg-red-900/50 hover:bg-red-800/50 border border-red-700/50 text-red-300",
  ghost:
    "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-14 px-6 text-lg",
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
        // Base styles
        "flex items-center justify-center gap-2 rounded-lg font-typewriter font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden",
        // Variant styles
        buttonVariants[variant],
        // Size styles
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export type { ButtonProps };

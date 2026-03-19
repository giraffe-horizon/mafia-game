import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        // Base — sharp, uppercase, tracking
        "inline-flex items-center justify-center gap-2",
        "font-display font-bold uppercase tracking-widest",
        "transition-colors duration-[0.1s]",
        "border-0 outline-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        // Size
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        // Variant — primary: coral fill (rubber stamp)
        variant === "primary" && [
          "bg-stamp text-on-paper",
          "hover:bg-stamp-dark",
          "active:scale-95",
        ],
        // secondary: dashed border
        variant === "secondary" && [
          "bg-transparent text-on-surface border-2 border-dashed border-on-surface/50",
          "hover:border-on-surface hover:text-on-surface",
          "active:scale-95",
        ],
        // danger: red stamp
        variant === "danger" && [
          "bg-transparent text-stamp border-2 border-dashed border-stamp",
          "hover:bg-stamp hover:text-on-paper",
          "active:scale-95",
        ],
        // ghost: underline only
        variant === "ghost" && [
          "bg-transparent text-on-surface-dim underline decoration-dotted underline-offset-4",
          "hover:text-on-surface",
        ],
        fullWidth && "w-full",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-base animate-spin">refresh</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-base">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  onPaper?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, onPaper = false, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-transparent",
        "border-0 border-b-2 outline-none",
        "font-display text-sm tracking-wide",
        "py-2 px-0",
        "placeholder:opacity-40",
        onPaper
          ? ["border-on-paper/30 text-on-paper placeholder:text-on-paper", "focus:border-on-paper"]
          : [
              "border-on-surface/30 text-on-surface placeholder:text-on-surface",
              "focus:border-stamp",
            ],
        error && "border-stamp",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  onPaper?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, onPaper = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-transparent resize-none",
        "border-0 border-b-2 outline-none",
        "font-display text-sm tracking-wide",
        "py-2 px-0",
        "placeholder:opacity-40",
        onPaper
          ? ["border-on-paper/30 text-on-paper placeholder:text-on-paper", "focus:border-on-paper"]
          : [
              "border-on-surface/30 text-on-surface placeholder:text-on-surface",
              "focus:border-stamp",
            ],
        error && "border-stamp",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

/* Legacy aliases for backward compatibility */
export const TextArea = Textarea;
export type { TextareaProps as TextAreaProps };

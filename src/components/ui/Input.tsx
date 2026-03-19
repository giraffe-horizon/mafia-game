import React from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string; // material symbols icon name
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: string; // material symbols icon name
}

export function Input({ icon, className, ...props }: InputProps) {
  if (icon) {
    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-0 text-on-surface/40">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
        <input
          className={cn(
            // No bg, single bottom border
            "flex w-full bg-transparent text-on-surface border-0 border-b border-on-surface/30",
            "focus:outline-none focus:border-primary h-10 font-display font-medium",
            "placeholder:text-on-surface/30 transition-colors pl-7 pr-0",
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={cn(
        "flex w-full bg-transparent text-on-surface border-0 border-b border-on-surface/30",
        "focus:outline-none focus:border-primary h-10 px-0 font-display font-medium",
        "placeholder:text-on-surface/30 transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ icon, className, ...props }: TextAreaProps) {
  if (icon) {
    return (
      <div className="relative">
        <span className="absolute top-2 left-0 flex items-start pl-0 text-on-surface/40">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
        <textarea
          className={cn(
            "flex w-full bg-transparent text-on-surface border border-on-surface/20 p-3",
            "focus:outline-none focus:border-primary font-display font-medium",
            "placeholder:text-on-surface/30 transition-colors resize-none pl-7 rounded-none",
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <textarea
      className={cn(
        "flex w-full bg-transparent text-on-surface border border-on-surface/20 p-3",
        "focus:outline-none focus:border-primary font-display font-medium",
        "placeholder:text-on-surface/30 transition-colors resize-none rounded-none",
        className
      )}
      {...props}
    />
  );
}

export type { InputProps, TextAreaProps };

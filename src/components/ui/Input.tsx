import React from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string; // material symbols icon name
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: string; // material symbols icon name
}

// "Form" input style — no background, single bottom border
// Focus: bottom border shifts to primary (stamp red)
export function Input({ icon, className, ...props }: InputProps) {
  if (icon) {
    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface/50">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <input
          className={cn(
            // No background, single bottom border
            "flex w-full bg-transparent text-on-surface border-0 border-b border-on-surface/40 focus:border-stamp focus:outline-none h-10 font-display font-medium leading-normal placeholder:text-on-surface/30",
            // With icon padding
            "pl-10 pr-3",
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
        // No background, single bottom border
        "flex w-full bg-transparent text-on-surface border-0 border-b border-on-surface/40 focus:border-stamp focus:outline-none h-10 px-0 font-display font-medium leading-normal placeholder:text-on-surface/30",
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
        <span className="absolute top-3 left-0 flex items-center pl-3 text-on-surface/50">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <textarea
          className={cn(
            // No background, border only at bottom; for textarea use full border for readability
            "flex w-full bg-surface-low text-on-surface border border-on-surface/20 focus:border-stamp focus:outline-none p-3 font-display font-medium leading-normal placeholder:text-on-surface/30 resize-none",
            // With icon padding
            "pl-10",
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
        // No background, border only for multi-line
        "flex w-full bg-surface-low text-on-surface border border-on-surface/20 focus:border-stamp focus:outline-none p-3 font-display font-medium leading-normal placeholder:text-on-surface/30 resize-none",
        className
      )}
      {...props}
    />
  );
}

export type { InputProps, TextAreaProps };

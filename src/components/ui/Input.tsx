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
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <input
          className={cn(
            // Base styles
            "flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/30 bg-black/40 backdrop-blur-sm h-10 font-medium leading-normal transition-all placeholder:text-slate-600",
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
        // Base styles
        "flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-600 bg-slate-800 h-10 px-3 font-medium leading-normal transition-all placeholder:text-slate-600",
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
        <span className="absolute top-3 left-0 flex items-center pl-3 text-slate-400">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <textarea
          className={cn(
            // Base styles
            "flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/30 bg-black/40 backdrop-blur-sm p-3 font-medium leading-normal transition-all placeholder:text-slate-600 resize-none",
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
        // Base styles
        "flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-600 bg-slate-800 p-3 font-medium leading-normal transition-all placeholder:text-slate-600 resize-none",
        className
      )}
      {...props}
    />
  );
}

export type { InputProps, TextAreaProps };

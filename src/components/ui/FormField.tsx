import React from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export default function FormField({ label, error, children, className, ...props }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col w-full", className)} {...props}>
      <p className="text-slate-400 text-sm font-typewriter leading-normal pb-2 uppercase tracking-widest pl-1">
        {label}
      </p>
      {children}
      {error && <p className="text-red-400 text-xs font-typewriter mt-1 pl-1">{error}</p>}
    </div>
  );
}

export type { FormFieldProps };

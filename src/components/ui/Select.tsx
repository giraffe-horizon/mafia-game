import React from "react";
import { cn } from "@/lib/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        // Base styles
        "w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-600 bg-slate-800 h-10 px-3 text-sm font-medium transition-all",
        // Placeholder styles
        "text-white",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export type { SelectProps, SelectOption };

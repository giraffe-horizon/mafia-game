import React from "react";
import { cn } from "@/lib/cn";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  label,
  showPercentage = false,
  className,
  ...props
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-slate-400 text-xs font-typewriter uppercase tracking-widest">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-slate-500 text-xs font-typewriter">{clampedValue}%</span>
          )}
        </div>
      )}
      <div
        className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export type { ProgressBarProps };

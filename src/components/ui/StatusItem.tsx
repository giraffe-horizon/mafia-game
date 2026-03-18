import React from "react";
import { cn } from "@/lib/cn";

interface StatusItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  label: string;
  labelClassName?: string;
  trailing?: React.ReactNode;
}

export default function StatusItem({
  icon,
  label,
  labelClassName,
  trailing,
  children,
  className,
  ...props
}: StatusItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-black/20",
        className
      )}
      {...props}
    >
      {icon}
      <span className={cn("text-sm font-medium flex-1", labelClassName)}>{label}</span>
      {trailing}
      {children}
    </div>
  );
}

export type { StatusItemProps };

import React from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLParagraphElement> {
  icon?: string;
  children: React.ReactNode;
}

export default function SectionHeader({ icon, children, className, ...props }: SectionHeaderProps) {
  return (
    <p
      className={cn(
        "text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[12px] align-middle mr-1">{icon}</span>
      )}
      {children}
    </p>
  );
}

export type { SectionHeaderProps };

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps extends HTMLAttributes<HTMLParagraphElement> {
  icon?: string;
  children: React.ReactNode;
}

export function SectionHeader({ icon, children, className, ...props }: SectionHeaderProps) {
  return (
    <p
      className={cn(
        "text-on-surface-dim text-xs font-display font-bold uppercase tracking-widest mb-2",
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

export default SectionHeader;

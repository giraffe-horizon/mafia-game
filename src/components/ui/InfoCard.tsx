import React from "react";
import { cn } from "@/lib/cn";

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: string;
  iconClassName?: string;
  title: string;
  titleClassName?: string;
  description?: string;
}

export default function InfoCard({
  icon,
  iconClassName,
  title,
  titleClassName,
  description,
  children,
  className,
  ...props
}: InfoCardProps) {
  return (
    <div
      className={cn("p-4 rounded-xl bg-black/30 border border-slate-800 text-center", className)}
      {...props}
    >
      <span
        className={cn(
          "material-symbols-outlined text-[28px] text-slate-600 mb-1 block",
          iconClassName
        )}
      >
        {icon}
      </span>
      <p
        className={cn(
          "text-slate-500 font-typewriter uppercase tracking-widest text-xs",
          titleClassName
        )}
      >
        {title}
      </p>
      {description && <p className="text-slate-600 text-xs mt-1">{description}</p>}
      {children}
    </div>
  );
}

export type { InfoCardProps };

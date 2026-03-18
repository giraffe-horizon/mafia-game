"use client";

import { cn } from "@/lib/cn";

interface RoleHiddenProps {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

/**
 * Wrapper that hides role-sensitive content when role is not revealed.
 * Shows a hint to reveal role instead.
 */
export default function RoleHidden({
  visible,
  children,
  className,
  hint = "Odkryj rolę aby zobaczyć szczegóły",
}: RoleHiddenProps) {
  if (visible) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn("p-3 rounded-xl bg-black/30 border border-slate-800 text-center", className)}
    >
      <span className="material-symbols-outlined text-[20px] text-slate-600 mb-1 block">
        visibility_off
      </span>
      <p className="text-slate-600 text-xs font-typewriter">{hint}</p>
    </div>
  );
}

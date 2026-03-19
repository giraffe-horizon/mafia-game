import type { ReactNode } from "react";
import { Button } from "@/components/ui";

export interface ActionConfirmationProps {
  label: string;
  targetName: string;
  onChangeDecision: () => void;
  children?: ReactNode;
}

export default function ActionConfirmation({
  label,
  targetName,
  onChangeDecision,
  children,
}: ActionConfirmationProps) {
  return (
    <div className="mx-5 mt-4 p-4 rounded-xl bg-black/40 border border-green-900/40">
      <p className="text-green-400 text-xs font-typewriter uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-slate-300 text-sm">
        <span className="text-white font-medium">{targetName}</span>
      </p>
      {children}
      <Button
        onClick={() => onChangeDecision()}
        variant="ghost"
        size="sm"
        icon="edit"
        className="mt-3 w-full"
      >
        Zmień decyzję
      </Button>
    </div>
  );
}

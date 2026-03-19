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
    <div className="mx-5 mt-4 p-4 bg-surface-low border border-stamp-green/30">
      <p className="text-stamp-green text-xs font-display uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-on-surface/70 text-sm font-display">
        <span className="text-on-surface font-bold">{targetName}</span>
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

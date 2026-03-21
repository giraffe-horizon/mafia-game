import { PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";
import { SectionHeader } from "@/components/ui";

export interface PhaseIndicatorProps {
  phase: string;
}

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  return (
    <div className="mx-5 mt-5 p-4 bg-surface-low border border-surface-highest flex items-center gap-3">
      <span className="material-symbols-outlined text-[28px] text-primary">
        {PHASE_ICONS[phase]}
      </span>
      <div>
        <SectionHeader className="mb-0">Faza gry</SectionHeader>
        <p className="font-display text-xl font-bold text-on-surface uppercase tracking-wider">
          {PHASE_LABELS[phase]}
        </p>
      </div>
    </div>
  );
}

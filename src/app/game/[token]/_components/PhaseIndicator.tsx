import { PHASE_LABELS, PHASE_ICONS } from "@/lib/constants";
import { SectionHeader } from "@/components/ui";

export interface PhaseIndicatorProps {
  phase: string;
}

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  return (
    <div className="mx-5 mt-5 p-4 rounded-xl bg-black/40 border border-slate-700 flex items-center gap-3">
      <span className="material-symbols-outlined text-[28px] text-primary">
        {PHASE_ICONS[phase]}
      </span>
      <div>
        <SectionHeader className="mb-0">Faza gry</SectionHeader>
        <p className="font-typewriter text-xl font-bold text-white uppercase tracking-wider">
          {PHASE_LABELS[phase]}
        </p>
      </div>
    </div>
  );
}

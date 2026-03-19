import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import { Card, SectionHeader } from "@/components/ui";

export interface RoleCardProps {
  role: string | undefined;
  roleVisible: boolean;
  onToggle: () => void;
}

export default function RoleCard({ role, roleVisible, onToggle }: RoleCardProps) {
  const roleKey = role ?? "civilian";

  return (
    <div className="mx-5 mt-5">
      <SectionHeader className="pl-1">Twoja rola</SectionHeader>
      <Card
        variant="highlighted"
        onClick={onToggle}
        className="w-full p-5 cursor-pointer transition-all active:scale-[0.98]"
        role="button"
        tabIndex={0}
        aria-label={roleVisible ? "Ukryj rolę" : "Pokaż rolę"}
      >
        {roleVisible ? (
          <div className="flex items-center gap-4">
            <span className={`material-symbols-outlined text-[48px] ${ROLE_COLORS[roleKey]}`}>
              {ROLE_ICONS[roleKey]}
            </span>
            <div className="text-left">
              <p
                className={`font-typewriter text-2xl font-bold uppercase tracking-wider ${ROLE_COLORS[roleKey]}`}
              >
                {ROLE_LABELS[roleKey]}
              </p>
              {role === "mafia" && (
                <p className="text-red-400/70 text-xs font-typewriter mt-1">
                  🔴 Twoi wspólnicy są oznaczeni na liście
                </p>
              )}
              <p className="text-slate-500 text-sm mt-1">Stuknij aby ukryć</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="material-symbols-outlined text-[32px] text-slate-600">
              visibility_off
            </span>
            <p className="font-typewriter text-slate-500 uppercase tracking-widest text-sm">
              Stuknij aby zobaczyć rolę
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

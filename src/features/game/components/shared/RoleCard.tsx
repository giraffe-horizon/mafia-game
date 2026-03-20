import { ROLE_LABELS, ROLE_ICONS } from "@/lib/constants";
import { Stamp } from "@/components/ui";

export interface RoleCardProps {
  role: string | undefined;
  roleVisible: boolean;
  onToggle: () => void;
}

const roleStampVariant: Record<
  string,
  "classified" | "occupied" | "secret" | "approved" | "rejected"
> = {
  mafia: "classified",
  detective: "approved",
  doctor: "approved",
  civilian: "secret",
};

const roleTint: Record<string, string> = {
  mafia: "bg-red-950/30 border-red-900/40",
  detective: "bg-blue-950/20 border-blue-900/40",
  doctor: "bg-green-950/20 border-green-900/40",
  civilian: "bg-surface-highest/20 border-surface-highest",
};

const roleTextColor: Record<string, string> = {
  mafia: "text-stamp",
  detective: "text-blue-400",
  doctor: "text-green-400",
  civilian: "text-on-surface/50",
};

export default function RoleCard({ role, roleVisible, onToggle }: RoleCardProps) {
  const roleKey = role ?? "civilian";
  const tint = roleTint[roleKey] ?? "bg-surface-highest/20 border-surface-highest";
  const textColor = roleTextColor[roleKey] ?? "text-on-surface";

  return (
    <div className="mx-4 mt-4">
      <div className="font-display font-black text-[10px] uppercase tracking-widest text-on-surface/30 mb-1.5 pl-0.5">
        Twoja rola
      </div>
      <button
        onClick={onToggle}
        className={`w-full border p-4 cursor-pointer transition-all active:opacity-70 text-left ${roleVisible ? tint : "bg-surface-highest/20 border-surface-highest"}`}
        aria-label={roleVisible ? "Ukryj rolę" : "Pokaż rolę"}
      >
        {roleVisible ? (
          <div className="flex items-center gap-4">
            <span className={`material-symbols-outlined text-[40px] ${textColor}`}>
              {ROLE_ICONS[roleKey]}
            </span>
            <div className="flex-1">
              <p
                className={`font-display font-black text-xl uppercase tracking-widest ${textColor}`}
              >
                {ROLE_LABELS[roleKey]}
              </p>
              {role === "mafia" && (
                <p className="text-stamp/60 text-xs font-display mt-1 uppercase tracking-wider">
                  Twoi wspólnicy są oznaczeni
                </p>
              )}
              <p className="text-on-surface/30 text-xs mt-1 font-display uppercase tracking-widest">
                stuknij aby ukryć
              </p>
            </div>
            <Stamp variant={roleStampVariant[roleKey] ?? "secret"} rotate={3}>
              {ROLE_LABELS[roleKey]}
            </Stamp>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <span className="material-symbols-outlined text-[28px] text-on-surface/20">
              visibility_off
            </span>
            <p className="font-display font-black text-on-surface/30 uppercase tracking-widest text-xs">
              Stuknij aby zobaczyć rolę
            </p>
            <div className="ml-auto">
              <div className="redacted w-20 h-4 bg-on-paper/80">&nbsp;</div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

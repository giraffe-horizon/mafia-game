import type { HostMission } from "@/features/game/types";
import { Stamp } from "@/components/ui";

interface ReviewViewProps {
  isHost: boolean;
  showPoints: boolean;
  hostMissions?: HostMission[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onFinalize: () => void;
}

export default function ReviewView({
  isHost,
  showPoints,
  hostMissions,
  onComplete,
  onDelete,
  onFinalize,
}: ReviewViewProps) {
  if (!showPoints) return null;

  if (isHost) {
    return (
      <div className="mx-4 mt-4">
        <div className="border border-amber-900/40 bg-surface-low">
          <div className="border-b border-amber-900/40 px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-400">
              rate_review
            </span>
            <span className="font-display font-black text-xs uppercase tracking-widest text-amber-400/80">
              Przegląd misji
            </span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {hostMissions
              ?.filter((m) => !m.isCompleted)
              .map((m) => (
                <div key={m.id} className="border border-on-surface/10 bg-surface-low p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-black text-xs uppercase tracking-wider text-primary mb-1">
                        {m.playerNickname}
                      </p>
                      <p className="font-display text-sm text-on-surface/80">{m.description}</p>
                      <p className="font-display text-[10px] text-on-surface/40 mt-1 uppercase tracking-widest">
                        {m.points} pkt
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => onComplete(m.id)}
                        className="flex items-center justify-center w-9 h-9 border border-green-900/50 bg-green-950/20 text-green-400 hover:bg-green-950/40"
                        title="Wykonana"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                      <button
                        onClick={() => onDelete(m.id)}
                        className="flex items-center justify-center w-9 h-9 border border-primary/30 bg-surface-lowest text-primary hover:bg-surface-low"
                        title="Niewykonana — usuń"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Completed missions */}
            {hostMissions
              ?.filter((m) => m.isCompleted)
              .map((m) => (
                <div
                  key={m.id}
                  className="border border-green-900/20 bg-surface-low/50 p-3 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-display font-black text-xs uppercase tracking-wider text-on-surface/50 mb-0.5">
                        {m.playerNickname}
                      </p>
                      <p className="font-display text-xs text-on-surface/40 line-through">
                        {m.description}
                      </p>
                    </div>
                    <Stamp color="green" rotate={-2} className="text-[9px]">
                      Wykonano
                    </Stamp>
                  </div>
                </div>
              ))}

            {(!hostMissions || hostMissions.filter((m) => !m.isCompleted).length === 0) && (
              <p className="font-display text-green-400/60 text-xs text-center py-2 uppercase tracking-widest">
                Wszystkie misje ocenione
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onFinalize()}
          className="w-full mt-3 flex items-center justify-center gap-2 h-12 bg-primary hover:bg-primary-dark text-on-paper font-display font-black uppercase tracking-widest text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">emoji_events</span>
          Zakończ rundę
        </button>
      </div>
    );
  }

  // Non-host waiting view
  return (
    <div className="mx-4 mt-4 border border-on-surface/10 p-6 flex flex-col items-center gap-3 text-center">
      <span className="material-symbols-outlined text-[36px] text-amber-400/40">
        hourglass_empty
      </span>
      <p className="font-display uppercase tracking-widest text-on-surface/40 text-sm">
        MG ocenia misje...
      </p>
    </div>
  );
}

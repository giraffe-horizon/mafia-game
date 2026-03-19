import { useGameStore } from "../_stores/gameStore";

interface HostMission {
  id: string;
  playerNickname: string;
  description: string;
  points: number;
  isCompleted: boolean;
}

interface ReviewViewProps {
  isHost: boolean;
  showPoints: boolean;
  hostMissions?: HostMission[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ReviewView({
  isHost,
  showPoints,
  hostMissions,
  onComplete,
  onDelete,
}: ReviewViewProps) {
  const finalizeGame = useGameStore((s) => s.finalizeGame);
  if (!showPoints) return null;

  if (isHost) {
    const pending = hostMissions?.filter((m) => !m.isCompleted) ?? [];
    const done = hostMissions?.filter((m) => m.isCompleted) ?? [];

    return (
      <div className="mx-5 mt-5">
        {/* Dossier header */}
        <div className="border border-on-surface/15 bg-surface-low p-4 mb-4 tape-corner">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[20px] text-on-surface/40">
              rate_review
            </span>
            <p className="font-display font-bold uppercase tracking-widest text-[10px] text-on-surface/40">
              Przegląd misji
            </p>
          </div>
          <p className="font-display font-bold text-lg uppercase tracking-wider text-on-surface">
            Oceń wykonanie zadań
          </p>
          <p className="text-on-surface/30 text-xs font-display mt-0.5">
            Potwierdź lub odrzuć misje przed zakończeniem rundy
          </p>
        </div>

        {/* Pending missions */}
        {pending.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {pending.map((m) => (
              <div key={m.id} className="border border-on-surface/12 bg-surface-low p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface/60 text-[10px] font-display uppercase tracking-widest mb-0.5">
                      {m.playerNickname}
                    </p>
                    <p className="text-on-surface text-sm font-display">{m.description}</p>
                    <p className="text-on-surface/30 text-[10px] font-display mt-1">
                      {m.points} pkt
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onComplete(m.id)}
                      className="size-9 flex items-center justify-center border border-green-700/40 bg-green-950/20 text-green-400 hover:bg-green-950/40"
                      title="Wykonana"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="size-9 flex items-center justify-center border border-stamp/30 bg-stamp/5 text-stamp hover:bg-stamp/10"
                      title="Niewykonana"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed missions with WYKONANO stamp */}
        {done.length > 0 && (
          <div className="flex flex-col gap-2 mb-4 opacity-60">
            {done.map((m) => (
              <div
                key={m.id}
                className="border border-green-700/20 bg-green-950/10 p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface/40 text-[10px] font-display uppercase tracking-widest mb-0.5">
                    {m.playerNickname}
                  </p>
                  <p className="text-on-surface/50 text-sm font-display line-through">
                    {m.description}
                  </p>
                </div>
                <span className="stamp stamp-green text-[9px] shrink-0">WYKONANO</span>
              </div>
            ))}
          </div>
        )}

        {pending.length === 0 && (
          <p className="text-green-400/50 text-xs font-display text-center mb-4 uppercase tracking-wider">
            ✓ Wszystkie misje ocenione
          </p>
        )}

        <button
          onClick={() => finalizeGame()}
          className="w-full flex items-center justify-center gap-2 h-12 bg-stamp text-on-paper font-display font-bold uppercase tracking-widest text-sm border-2 border-stamp hover:bg-stamp/90"
        >
          <span className="material-symbols-outlined text-[18px]">emoji_events</span>
          Zakończ rundę
        </button>
      </div>
    );
  }

  // Non-host waiting view
  return (
    <div className="mx-5 mt-5 p-5 border border-on-surface/10 bg-surface-low text-center">
      <span className="material-symbols-outlined text-[36px] text-on-surface/20 mb-2 block">
        hourglass_empty
      </span>
      <p className="text-on-surface/35 font-display uppercase tracking-widest text-sm">
        MG ocenia misje...
      </p>
    </div>
  );
}

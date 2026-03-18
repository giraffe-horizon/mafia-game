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
    return (
      <div className="mx-5 mt-5 p-5 rounded-xl bg-amber-950/20 border border-amber-700/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[28px] text-amber-400">rate_review</span>
          <div>
            <p className="font-typewriter text-amber-400 text-sm font-bold uppercase tracking-widest">
              Przegląd misji
            </p>
            <p className="text-slate-500 text-xs mt-0.5">Oceń misje przed zakończeniem rundy</p>
          </div>
        </div>
        {hostMissions
          ?.filter((m) => !m.isCompleted)
          .map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-black/30 border border-slate-800"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{m.playerNickname}</p>
                <p className="text-slate-400 text-xs mt-0.5">{m.description}</p>
                <p className="text-slate-600 text-xs">{m.points} pkt</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onComplete(m.id)}
                  className="size-9 flex items-center justify-center rounded-lg bg-green-900/30 border border-green-700/40 text-green-400 hover:bg-green-900/50 transition-all"
                  title="Wykonana"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="size-9 flex items-center justify-center rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 transition-all"
                  title="Niewykonana — usuń"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          ))}
        {(!hostMissions || hostMissions.filter((m) => !m.isCompleted).length === 0) && (
          <p className="text-green-400/60 text-xs font-typewriter text-center mb-3">
            ✓ Wszystkie misje ocenione
          </p>
        )}
        <button
          onClick={() => finalizeGame()}
          className="w-full mt-3 flex items-center justify-center gap-2 h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold font-typewriter uppercase tracking-wider transition-all shadow-[0_4px_14px_0_rgba(218,11,11,0.39)]"
        >
          <span className="material-symbols-outlined text-[20px]">emoji_events</span>
          Zakończ rundę
        </button>
      </div>
    );
  }

  // Non-host waiting view
  return (
    <div className="mx-5 mt-5 p-5 rounded-xl bg-black/30 border border-slate-800 text-center">
      <span className="material-symbols-outlined text-[36px] text-amber-400/60 mb-2 block">
        hourglass_empty
      </span>
      <p className="text-slate-400 font-typewriter uppercase tracking-widest text-sm">
        MG ocenia misje...
      </p>
    </div>
  );
}

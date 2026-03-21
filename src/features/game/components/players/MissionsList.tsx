interface Mission {
  id: string;
  description: string;
  points: number;
  isCompleted: boolean;
}

interface MissionsListProps {
  missions: Mission[];
  showPoints: boolean;
}

export default function MissionsList({ missions, showPoints }: MissionsListProps) {
  if (missions.length === 0 || !showPoints) return null;

  return (
    <div className="mx-5 mt-4">
      <p className="text-on-surface/40 text-xs font-display uppercase tracking-widest mb-2 pl-1">
        Twoje misje
      </p>
      <div className="flex flex-col gap-2">
        {missions.map((m) => (
          <div
            key={m.id}
            className={`p-3 border ${m.isCompleted ? "bg-stamp-green/10 border-stamp-green/30 opacity-70" : "bg-surface-low border-primary/20"}`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${m.isCompleted ? "text-stamp-green" : "text-primary"}`}
              >
                {m.isCompleted ? "check_circle" : "task"}
              </span>
              <p
                className={`text-sm flex-1 font-display ${m.isCompleted ? "text-on-surface/40 line-through" : "text-on-surface"}`}
              >
                {m.description}
              </p>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {m.points > 0 && (
                  <span
                    className={`text-xs font-display font-bold ${m.isCompleted ? "text-stamp-green" : "text-primary"}`}
                  >
                    +{m.points}pkt
                  </span>
                )}
                <span
                  className={`text-[10px] font-display uppercase tracking-wider ${m.isCompleted ? "text-stamp-green" : "text-on-surface/40"}`}
                >
                  {m.isCompleted ? "✓ wykonana" : "⏳ w trakcie"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

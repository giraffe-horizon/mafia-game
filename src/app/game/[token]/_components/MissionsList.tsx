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
      <p className="text-slate-500 text-xs font-typewriter uppercase tracking-widest mb-2 pl-1">
        Twoje misje
      </p>
      <div className="flex flex-col gap-2">
        {missions.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg border ${m.isCompleted ? "bg-green-950/20 border-green-900/40 opacity-70" : "bg-black/40 border-yellow-900/40"}`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${m.isCompleted ? "text-green-400" : "text-yellow-500"}`}
              >
                {m.isCompleted ? "check_circle" : "task"}
              </span>
              <p
                className={`text-sm flex-1 ${m.isCompleted ? "text-slate-400 line-through" : "text-white"}`}
              >
                {m.description}
              </p>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {m.points > 0 && (
                  <span
                    className={`text-xs font-typewriter font-bold ${m.isCompleted ? "text-green-400" : "text-yellow-400"}`}
                  >
                    +{m.points}pkt
                  </span>
                )}
                <span
                  className={`text-[10px] font-typewriter uppercase tracking-wider ${m.isCompleted ? "text-green-500" : "text-slate-600"}`}
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

import { SectionHeader, Card } from "@/components/ui";
import { positionColor } from "@/lib/constants";

interface RoundScore {
  playerId: string;
  nickname: string;
  missionPoints: number;
  survived: boolean;
  won: boolean;
  totalScore: number;
}

interface RankingEntry {
  playerId: string;
  totalScore: number;
}

interface ScoringTableProps {
  roundScores: RoundScore[];
  ranking: RankingEntry[];
  totalRounds: number;
}

export default function ScoringTable({ roundScores, ranking, totalRounds }: ScoringTableProps) {
  if (roundScores.length === 0) return null;

  return (
    <div className="mt-5">
      <SectionHeader className="mb-3 pl-1">
        Punktacja {totalRounds > 1 ? `— runda ${totalRounds}` : ""}
      </SectionHeader>
      <Card className="overflow-hidden">
        <table className="w-full text-sm font-typewriter">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-3">#</th>
              <th className="text-left py-2 px-1">Gracz</th>
              <th className="text-center py-2 px-1">📋</th>
              <th className="text-center py-2 px-1">💀</th>
              <th className="text-center py-2 px-1">⭐</th>
              <th className="text-center py-2 px-1">Runda</th>
              <th className="text-right py-2 px-3 text-primary">Ogółem</th>
            </tr>
          </thead>
          <tbody>
            {[...roundScores]
              .map((s) => {
                const cumulative = ranking.find((r) => r.playerId === s.playerId);
                return { ...s, cumulativeScore: cumulative?.totalScore ?? s.totalScore };
              })
              .sort((a, b) => b.cumulativeScore - a.cumulativeScore)
              .map((s, i) => (
                <tr
                  key={s.playerId}
                  className={`border-b border-slate-800/50 ${i === 0 ? "bg-amber-950/10" : ""}`}
                >
                  <td className={`py-2 px-3 font-bold ${positionColor(i)}`}>{i + 1}</td>
                  <td className="py-2 px-1 text-white">{s.nickname}</td>
                  <td className="text-center py-2 px-1 text-slate-400">
                    {s.missionPoints > 0 ? `+${s.missionPoints}` : "—"}
                  </td>
                  <td className="text-center py-2 px-1 text-slate-400">
                    {s.survived ? "+1" : "—"}
                  </td>
                  <td className="text-center py-2 px-1 text-slate-400">{s.won ? "+3" : "—"}</td>
                  <td className="text-center py-2 px-1 text-slate-500">{s.totalScore}</td>
                  <td className={`text-right py-2 px-3 font-bold text-lg ${positionColor(i)}`}>
                    {s.cumulativeScore}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-2 flex gap-3 text-xs text-slate-600 font-typewriter px-1">
        <span>📋 Misje</span>
        <span>💀 Przeżycie (+1)</span>
        <span>⭐ Wygrana (+3)</span>
      </div>
    </div>
  );
}

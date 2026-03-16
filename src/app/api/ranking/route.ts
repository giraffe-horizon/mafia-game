export const runtime = "edge";

import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { D1Database } from "@/lib/db";

export interface RankingEntry {
  nickname: string;
  gamesPlayed: number;
  gamesWon: number;
  missionPoints: number;
  totalScore: number;
}

export async function GET() {
  try {
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;

    // Aggregate per-nickname stats from finished games
    const { results } = await db
      .prepare(
        `SELECT
           gp.nickname,
           COUNT(DISTINCT g.id) AS games_played,
           SUM(
             CASE
               WHEN g.winner = 'mafia' AND gp.role = 'mafia' THEN 1
               WHEN g.winner = 'town'  AND gp.role != 'mafia' THEN 1
               ELSE 0
             END
           ) AS games_won,
           COALESCE(
             (SELECT SUM(m.points)
              FROM missions m
              WHERE m.player_id = gp.player_id
                AND m.game_id = gp.game_id
                AND m.is_completed = 1),
             0
           ) AS mission_points
         FROM game_players gp
         JOIN games g ON g.id = gp.game_id
         WHERE g.status = 'finished' AND gp.is_host = 0
         GROUP BY gp.nickname
         ORDER BY (mission_points + games_won * 3) DESC
         LIMIT 50`
      )
      .all<{
        nickname: string;
        games_played: number;
        games_won: number;
        mission_points: number;
      }>();

    const ranking: RankingEntry[] = results.map((r) => ({
      nickname: r.nickname,
      gamesPlayed: r.games_played,
      gamesWon: r.games_won,
      missionPoints: r.mission_points,
      totalScore: r.mission_points + r.games_won * 3,
    }));

    return NextResponse.json({ ranking });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { D1Database } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;

    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Podaj token" }, { status: 400 });
    }

    // Find game by token
    const player = await db
      .prepare("SELECT game_id FROM game_players WHERE token = ?")
      .bind(token)
      .first<{ game_id: string }>();
    if (!player) {
      return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
    }

    // Get all players in this game session with their stats
    const { results } = await db
      .prepare(
        `SELECT
           gp.player_id,
           gp.nickname,
           gp.role,
           gp.is_alive,
           gp.is_host,
           COALESCE(
             (SELECT SUM(m.points)
              FROM missions m
              WHERE m.player_id = gp.player_id
                AND m.game_id = gp.game_id
                AND m.is_completed = 1),
             0
           ) AS mission_points,
           COALESCE(
             (SELECT COUNT(*)
              FROM missions m
              WHERE m.player_id = gp.player_id
                AND m.game_id = gp.game_id
                AND m.is_completed = 1),
             0
           ) AS missions_done,
           COALESCE(
             (SELECT COUNT(*)
              FROM missions m
              WHERE m.player_id = gp.player_id
                AND m.game_id = gp.game_id),
             0
           ) AS missions_total
         FROM game_players gp
         WHERE gp.game_id = ? AND gp.is_host = 0
         ORDER BY mission_points DESC, gp.nickname ASC`
      )
      .bind(player.game_id)
      .all<{
        player_id: string;
        nickname: string;
        role: string | null;
        is_alive: number;
        is_host: number;
        mission_points: number;
        missions_done: number;
        missions_total: number;
      }>();

    // Get game info
    const game = await db
      .prepare("SELECT status, winner, round FROM games WHERE id = ?")
      .bind(player.game_id)
      .first<{ status: string; winner: string | null; round: number }>();

    const ranking = results.map((r) => ({
      playerId: r.player_id,
      nickname: r.nickname,
      role: r.role,
      isAlive: r.is_alive === 1,
      missionPoints: r.mission_points,
      missionsDone: r.missions_done,
      missionsTotal: r.missions_total,
      survived: r.is_alive === 1,
      won: game?.winner
        ? (game.winner === "mafia" && r.role === "mafia") ||
          (game.winner === "town" && r.role !== "mafia")
        : false,
      totalScore:
        r.mission_points +
        (r.is_alive === 1 ? 1 : 0) +
        (game?.winner
          ? (game.winner === "mafia" && r.role === "mafia") ||
            (game.winner === "town" && r.role !== "mafia")
            ? 3
            : 0
          : 0),
    }));

    ranking.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      ranking,
      gameStatus: game?.status ?? "lobby",
      winner: game?.winner ?? null,
      round: game?.round ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

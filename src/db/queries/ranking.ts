import type { D1Database } from "@/db/types";

const SURVIVAL_BONUS = 1;
const WINNING_BONUS = 3;

interface RankingPlayer {
  playerId: string;
  nickname: string;
  role: string | null;
  isAlive: boolean;
  missionPoints: number;
  missionsDone: number;
  missionsTotal: number;
  survived: boolean;
  won: boolean;
  totalScore: number;
  roundsPlayed: number;
}

export interface RankingResult {
  ranking: RankingPlayer[];
  gameStatus: string;
  winner: string | null;
  round: number;
}

export async function getRanking(db: D1Database, token: string): Promise<RankingResult | null> {
  const player = await db
    .prepare("SELECT game_id FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string }>();

  if (!player) return null;

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

  const game = await db
    .prepare("SELECT status, winner, round FROM games WHERE id = ?")
    .bind(player.game_id)
    .first<{ status: string; winner: string | null; round: number }>();

  // Get completed round results for historical scoring
  const { results: roundResults } = await db
    .prepare("SELECT round, winner FROM round_results WHERE game_id = ? ORDER BY round ASC")
    .bind(player.game_id)
    .all<{ round: number; winner: string }>();

  const ranking: RankingPlayer[] = results.map((r) => {
    const survived = r.is_alive === 1;
    const won = game?.winner
      ? (game.winner === "mafia" && r.role === "mafia") ||
        (game.winner === "town" && r.role !== "mafia")
      : false;

    // Current round score
    const currentRoundScore =
      r.mission_points + (survived ? SURVIVAL_BONUS : 0) + (won ? WINNING_BONUS : 0);

    // Historical bonus from previous rounds (each completed round gave WINNING_BONUS to winners)
    // Note: survival/role info from previous rounds is not tracked per-player,
    // so historical scoring only counts winning bonus per past round
    // Missions accumulate naturally since they're all per game_id
    const roundsPlayed = roundResults.length;

    return {
      playerId: r.player_id,
      nickname: r.nickname,
      role: r.role,
      isAlive: survived,
      missionPoints: r.mission_points,
      missionsDone: r.missions_done,
      missionsTotal: r.missions_total,
      survived,
      won,
      totalScore: currentRoundScore,
      roundsPlayed,
    };
  });

  ranking.sort((a, b) => b.totalScore - a.totalScore);

  return {
    ranking,
    gameStatus: game?.status ?? "lobby",
    winner: game?.winner ?? null,
    round: game?.round ?? 0,
  };
}

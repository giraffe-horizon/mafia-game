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

  const game = await db
    .prepare("SELECT status, winner, round FROM games WHERE id = ?")
    .bind(player.game_id)
    .first<{ status: string; winner: string | null; round: number }>();

  // Get all non-host players with current round info
  const { results } = await db
    .prepare(
      `SELECT
           gp.player_id,
           gp.nickname,
           gp.role,
           gp.is_alive,
           gp.is_host
         FROM game_players gp
         WHERE gp.game_id = ? AND gp.is_host = 0
         ORDER BY gp.nickname ASC`
    )
    .bind(player.game_id)
    .all<{
      player_id: string;
      nickname: string;
      role: string | null;
      is_alive: number;
      is_host: number;
    }>();

  // Get cumulative scores from all completed rounds
  const { results: cumulativeScores } = await db
    .prepare(
      `SELECT
           player_id,
           SUM(total_score) as total_score,
           SUM(mission_points) as mission_points,
           SUM(survived) as survived_count,
           SUM(won) as won_count,
           COUNT(*) as rounds_played
         FROM player_round_scores
         WHERE game_id = ?
         GROUP BY player_id`
    )
    .bind(player.game_id)
    .all<{
      player_id: string;
      total_score: number;
      mission_points: number;
      survived_count: number;
      won_count: number;
      rounds_played: number;
    }>();

  const scoreMap = new Map(cumulativeScores.map((s) => [s.player_id, s]));

  // Get current round mission stats (for display purposes)
  const { results: missionStats } = await db
    .prepare(
      `SELECT
           player_id,
           COUNT(*) as missions_total,
           SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as missions_done
         FROM missions
         WHERE game_id = ?
         GROUP BY player_id`
    )
    .bind(player.game_id)
    .all<{ player_id: string; missions_total: number; missions_done: number }>();

  const missionMap = new Map(missionStats.map((m) => [m.player_id, m]));

  const ranking: RankingPlayer[] = results.map((r) => {
    const cumulative = scoreMap.get(r.player_id);
    const missions = missionMap.get(r.player_id);

    // Current round state (for display of current round info)
    const survived = r.is_alive === 1;
    const won = game?.winner
      ? (game.winner === "mafia" && r.role === "mafia") ||
        (game.winner === "town" && r.role !== "mafia")
      : false;

    // Total score is the sum from all completed rounds stored in player_round_scores
    const totalScore = cumulative?.total_score ?? 0;

    return {
      playerId: r.player_id,
      nickname: r.nickname,
      role: r.role,
      isAlive: survived,
      missionPoints: cumulative?.mission_points ?? 0,
      missionsDone: missions?.missions_done ?? 0,
      missionsTotal: missions?.missions_total ?? 0,
      survived,
      won,
      totalScore,
      roundsPlayed: cumulative?.rounds_played ?? 0,
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

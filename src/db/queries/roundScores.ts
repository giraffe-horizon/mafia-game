import type { D1Database } from "@/db/types";

export interface RoundScoreEntry {
  playerId: string;
  nickname: string;
  missionPoints: number;
  survived: boolean;
  won: boolean;
  totalScore: number;
}

export interface RoundScoresResult {
  round: number;
  winner: string;
  scores: RoundScoreEntry[];
}

export async function getRoundScores(
  db: D1Database,
  token: string
): Promise<RoundScoresResult | null> {
  const player = await db
    .prepare("SELECT game_id FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string }>();

  if (!player) return null;

  // Get the latest round_result for this game
  const roundResult = await db
    .prepare(
      "SELECT round, winner FROM round_results WHERE game_id = ? ORDER BY round DESC LIMIT 1"
    )
    .bind(player.game_id)
    .first<{ round: number; winner: string }>();

  if (!roundResult) return null;

  // Get player_round_scores for that round, joined with nicknames
  const { results } = await db
    .prepare(
      `SELECT
         prs.player_id,
         gp.nickname,
         prs.mission_points,
         prs.survived,
         prs.won,
         prs.total_score
       FROM player_round_scores prs
       JOIN game_players gp ON gp.player_id = prs.player_id AND gp.game_id = prs.game_id
       WHERE prs.game_id = ? AND prs.round = ?
       ORDER BY prs.total_score DESC`
    )
    .bind(player.game_id, roundResult.round)
    .all<{
      player_id: string;
      nickname: string;
      mission_points: number;
      survived: number;
      won: number;
      total_score: number;
    }>();

  return {
    round: roundResult.round,
    winner: roundResult.winner,
    scores: results.map((r) => ({
      playerId: r.player_id,
      nickname: r.nickname,
      missionPoints: r.mission_points,
      survived: r.survived === 1,
      won: r.won === 1,
      totalScore: r.total_score,
    })),
  };
}

CREATE TABLE IF NOT EXISTS player_round_scores (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  mission_points INTEGER NOT NULL DEFAULT 0,
  survived INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_player_round_scores_game ON player_round_scores(game_id, player_id);

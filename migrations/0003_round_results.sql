-- Round results: tracks winner per round for multi-round games
CREATE TABLE IF NOT EXISTS round_results (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  winner TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_round_results_game ON round_results(game_id);

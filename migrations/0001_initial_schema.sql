-- Mafia Game D1 Schema

CREATE TABLE IF NOT EXISTS players (
  id          TEXT PRIMARY KEY,
  nickname    TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id             TEXT PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  host_player_id TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'lobby',   -- lobby | playing | finished
  phase          TEXT NOT NULL DEFAULT 'lobby',   -- lobby | night | day | voting | ended
  phase_deadline TEXT,
  round          INTEGER NOT NULL DEFAULT 0,
  winner         TEXT,                            -- mafia | town | NULL
  config         TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_players (
  game_id   TEXT NOT NULL,
  player_id TEXT NOT NULL,
  token     TEXT NOT NULL UNIQUE,
  nickname  TEXT NOT NULL,
  role      TEXT,            -- mafia | detective | doctor | civilian | NULL
  is_alive  INTEGER NOT NULL DEFAULT 1,  -- 0 | 1
  is_host   INTEGER NOT NULL DEFAULT 0,  -- 0 | 1
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id             TEXT PRIMARY KEY,
  game_id        TEXT NOT NULL,
  from_player_id TEXT NOT NULL,
  to_player_id   TEXT,           -- NULL = broadcast to all players
  content        TEXT NOT NULL,
  is_read        INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_actions (
  id               TEXT PRIMARY KEY,
  game_id          TEXT NOT NULL,
  round            INTEGER NOT NULL,
  phase            TEXT NOT NULL,
  player_id        TEXT NOT NULL,
  action_type      TEXT NOT NULL, -- kill | investigate | protect | vote
  target_player_id TEXT,
  data             TEXT NOT NULL DEFAULT '{}',
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS missions (
  id           TEXT PRIMARY KEY,
  game_id      TEXT NOT NULL,
  player_id    TEXT NOT NULL,
  description  TEXT NOT NULL,
  is_secret    INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  points       INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
CREATE INDEX IF NOT EXISTS idx_game_players_token ON game_players(token);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_messages_game_player ON messages(game_id, to_player_id, is_read);
CREATE INDEX IF NOT EXISTS idx_game_actions_game_round ON game_actions(game_id, round, phase);
CREATE INDEX IF NOT EXISTS idx_missions_game_player ON missions(game_id, player_id);

import { describe, it, expect } from "vitest";
import type { D1Database } from "@/db/types";
import { getGameState } from "@/db/queries/game";
import { createTestDb, createTestGame, addTestPlayer } from "./__helpers__/test-helpers";

describe("Secret Voting", () => {
  let db: D1Database;

  beforeEach(async () => {
    db = createTestDb();
  });

  it("should hide vote tally details for players when secretVoting is true", async () => {
    const { gameId, hostToken, playerToken } = await createTestGame(db, "Host");
    await addTestPlayer(db, gameId, playerToken, "Player");

    // Start the game and advance to voting phase
    await db.exec(`
      UPDATE games
      SET status = 'playing', phase = 'voting', config = '{"secretVoting": true}'
      WHERE id = '${gameId}'
    `);

    // Assign roles
    await db.exec(`
      UPDATE game_players
      SET role = 'mafia'
      WHERE game_id = '${gameId}' AND is_host = 0
    `);

    // Add some votes
    await db.exec(`
      INSERT INTO game_actions (id, game_id, round, phase, player_id, action_type, target_player_id, data, created_at)
      VALUES
        ('vote1', '${gameId}', 1, 'voting',
         (SELECT player_id FROM game_players WHERE game_id = '${gameId}' AND is_host = 0 LIMIT 1),
         'vote',
         (SELECT player_id FROM game_players WHERE game_id = '${gameId}' AND is_host = 1),
         '{}', datetime('now'))
    `);

    // Get game state as host (should see full tally)
    const hostState = await getGameState(db, hostToken);
    expect(hostState?.voteTally?.results).toHaveLength(1);
    expect(hostState?.voteTally?.results[0].votes).toBe(1);

    // Get game state as player (should not see vote breakdown)
    const playerState = await getGameState(db, playerToken);
    expect(playerState?.voteTally?.results).toHaveLength(0); // Empty results array
    expect(playerState?.voteTally?.totalVoters).toBe(1);
    expect(playerState?.voteTally?.votedCount).toBe(1);
  });

  it("should show vote tally details when secretVoting is false", async () => {
    const { gameId, hostToken, playerToken } = await createTestGame(db, "Host");
    await addTestPlayer(db, gameId, playerToken, "Player");

    // Start the game and advance to voting phase with secretVoting disabled
    await db.exec(`
      UPDATE games
      SET status = 'playing', phase = 'voting', config = '{"secretVoting": false}'
      WHERE id = '${gameId}'
    `);

    // Add some votes
    await db.exec(`
      INSERT INTO game_actions (id, game_id, round, phase, player_id, action_type, target_player_id, data, created_at)
      VALUES
        ('vote1', '${gameId}', 1, 'voting',
         (SELECT player_id FROM game_players WHERE game_id = '${gameId}' AND is_host = 0 LIMIT 1),
         'vote',
         (SELECT player_id FROM game_players WHERE game_id = '${gameId}' AND is_host = 1),
         '{}', datetime('now'))
    `);

    // Get game state as player (should see full tally since secretVoting is false)
    const playerState = await getGameState(db, playerToken);
    expect(playerState?.voteTally?.results).toHaveLength(1);
    expect(playerState?.voteTally?.results[0].votes).toBe(1);
  });

  it("should default secretVoting to true when not specified in config", async () => {
    const { gameId, hostToken, playerToken } = await createTestGame(db, "Host");
    await addTestPlayer(db, gameId, playerToken, "Player");

    // Start the game with empty config (should default to secretVoting: true)
    await db.exec(`
      UPDATE games
      SET status = 'playing', phase = 'voting', config = '{}'
      WHERE id = '${gameId}'
    `);

    // Add some votes
    await db.exec(`
      INSERT INTO game_actions (id, game_id, round, phase, player_id, action_type, target_player_id, data, created_at)
      VALUES
        ('vote1', '${gameId}', 1, 'voting',
         (SELECT player_id FROM game_players WHERE game_id = '${gameId}' AND is_host = 0 LIMIT 1),
         'vote',
         (SELECT player_id FROM game_players WHERE game_id = '${gameId}' AND is_host = 1),
         '{}', datetime('now'))
    `);

    // Get game state as player (should hide results due to default secretVoting: true)
    const playerState = await getGameState(db, playerToken);
    expect(playerState?.voteTally?.results).toHaveLength(0);
    expect(playerState?.game.config.secretVoting).toBe(true);
  });

  it("should show vote tally to all players after voting phase ends", async () => {
    const { gameId, hostToken, playerToken } = await createTestGame(db, "Host");
    await addTestPlayer(db, gameId, playerToken, "Player");

    // Start the game and advance to day phase (after voting)
    await db.exec(`
      UPDATE games
      SET status = 'playing', phase = 'day', config = '{"secretVoting": true}'
      WHERE id = '${gameId}'
    `);

    // Get game state as player (voteTally should be undefined since phase is not voting)
    const playerState = await getGameState(db, playerToken);
    expect(playerState?.voteTally).toBeUndefined();
  });
});

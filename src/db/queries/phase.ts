import type { D1Database, GameRow, GamePlayerRow, Role } from "@/db/types";
import { now, buildRoles } from "@/db/helpers";
import { getMafiaKillActions } from "./actions";

export async function startGame(
  db: D1Database,
  token: string,
  customMafiaCount?: number,
  mode: "full" | "simple" = "full"
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może startować grę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.status !== "lobby") return { success: false, error: "Gra już trwa" };

  // Only non-host players get roles
  const { results: players } = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ? AND is_host = 0")
    .bind(playerRow.game_id)
    .all<{ player_id: string }>();

  const minPlayers = mode === "simple" ? 3 : 5;
  if (players.length < minPlayers)
    return { success: false, error: `Potrzeba minimum ${minPlayers} graczy (nie licząc MG)` };

  const n = players.length;
  const roles = buildRoles(n, customMafiaCount, mode);

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Save mode in game config for rematch
  await db.batch([
    db
      .prepare(
        "UPDATE games SET status = 'playing', phase = 'night', round = 1, config = ? WHERE id = ?"
      )
      .bind(JSON.stringify({ mode }), playerRow.game_id),
    db
      .prepare("UPDATE game_players SET role = 'gm' WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, playerRow.player_id),
    ...players.map((p, i) =>
      db
        .prepare("UPDATE game_players SET role = ? WHERE game_id = ? AND player_id = ?")
        .bind(roles[i], playerRow.game_id, p.player_id)
    ),
  ]);

  return { success: true };
}

export async function changePhase(
  db: D1Database,
  token: string,
  newPhase: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();
  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może zmieniać fazę" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();
  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.status !== "playing") return { success: false, error: "Gra nie trwa" };

  const currentPhase = gameRow.phase;
  if (currentPhase === newPhase) return { success: false, error: "Gra już jest w tej fazie" };

  const validTransitions: Partial<Record<string, string[]>> = {
    night: ["day"],
    day: ["voting"],
    voting: ["night"],
  };

  if (!validTransitions[currentPhase]?.includes(newPhase)) {
    return {
      success: false,
      error: `Nieprawidłowe przejście: ${currentPhase} → ${newPhase}`,
    };
  }

  let round = gameRow.round;

  // Resolve outgoing phase
  if (currentPhase === "night") {
    await resolveNight(db, gameRow, playerRow);
  } else if (currentPhase === "voting") {
    await resolveVoting(db, gameRow, playerRow);
  }

  // New round starts when transitioning to night (except first night which is round 1)
  if (newPhase === "night" && currentPhase === "voting") {
    round++;
  }

  // Check win conditions after elimination
  const winner = await checkWinConditions(db, playerRow.game_id);
  if (winner) {
    // Check for unrated missions before ending
    const { results: unratedMissions } = await db
      .prepare("SELECT COUNT(*) as count FROM missions WHERE game_id = ? AND points IS NULL")
      .bind(playerRow.game_id)
      .all<{ count: number }>();

    if (unratedMissions[0]?.count > 0) {
      await db
        .prepare("UPDATE games SET phase = 'review', winner = ? WHERE id = ?")
        .bind(winner, playerRow.game_id)
        .run();
    } else {
      await db
        .prepare("UPDATE games SET status = 'finished', phase = 'ended', winner = ? WHERE id = ?")
        .bind(winner, playerRow.game_id)
        .run();
    }
    return { success: true };
  }

  // Normal phase transition with optimistic concurrency guard
  const updateResult = await db
    .prepare("UPDATE games SET phase = ?, round = ? WHERE id = ? AND phase = ?")
    .bind(newPhase, round, playerRow.game_id, currentPhase)
    .run();

  if (!updateResult.meta.changes) {
    return { success: false, error: "Faza została już zmieniona (concurrent request)" };
  }

  return { success: true };
}

export async function resolveNight(
  db: D1Database,
  gameRow: GameRow,
  hostPlayer: GamePlayerRow
): Promise<void> {
  const { aliveMafia, killActions } = await getMafiaKillActions(db, gameRow.id, gameRow.round);

  let nightMsg = "Tej nocy nikt nie zginął.";

  // Process mafia kills
  if (aliveMafia.length > 0) {
    let killTarget: string | null = null;

    if (aliveMafia.length === 1) {
      // Single mafia - just need one kill action
      killTarget = killActions[0]?.target_player_id || null;
    } else {
      // Multiple mafia - need consensus
      if (killActions.length >= aliveMafia.length) {
        const targets = new Set(killActions.map((k) => k.target_player_id));
        if (targets.size === 1) {
          killTarget = killActions[0].target_player_id;
        }
      }
    }

    if (killTarget) {
      // Check if target is still alive (may have left mid-night)
      const targetAlive = await db
        .prepare("SELECT is_alive FROM game_players WHERE game_id = ? AND player_id = ?")
        .bind(gameRow.id, killTarget)
        .first<{ is_alive: number }>();

      if (!targetAlive || targetAlive.is_alive === 0) {
        killTarget = null;
      }
    }

    if (killTarget) {
      // Check if target was protected by doctor
      const { results: protections } = await db
        .prepare(
          "SELECT COUNT(*) as count FROM game_actions WHERE game_id = ? AND round = ? AND action_type = 'protect' AND target_player_id = ?"
        )
        .bind(gameRow.id, gameRow.round, killTarget)
        .all<{ count: number }>();

      const wasProtected = (protections[0]?.count || 0) > 0;

      if (!wasProtected) {
        // Kill the target
        await db
          .prepare("UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?")
          .bind(gameRow.id, killTarget)
          .run();

        const victimRow = await db
          .prepare("SELECT nickname FROM game_players WHERE game_id = ? AND player_id = ?")
          .bind(gameRow.id, killTarget)
          .first<{ nickname: string }>();

        nightMsg = `Tej nocy zginął: ${victimRow?.nickname || "Unknown"}`;
      } else {
        nightMsg = "Tej nocy nikt nie zginął.";
      }
    }
  }

  // Send night message to all players
  const { results: allPlayers } = await db
    .prepare("SELECT player_id FROM game_players WHERE game_id = ?")
    .bind(gameRow.id)
    .all<{ player_id: string }>();

  const messagePromises = allPlayers.map((player) =>
    db
      .prepare(
        "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
      )
      .bind(
        crypto.randomUUID(),
        gameRow.id,
        hostPlayer.player_id,
        player.player_id,
        nightMsg,
        now()
      )
      .run()
  );

  await Promise.all(messagePromises);
}

export async function resolveVoting(
  db: D1Database,
  gameRow: GameRow,
  hostPlayer: GamePlayerRow
): Promise<void> {
  // Count votes and find most voted player
  const { results: voteCounts } = await db
    .prepare(
      `SELECT target_player_id, COUNT(*) as votes
       FROM game_actions
       WHERE game_id = ? AND round = ? AND phase = 'voting' AND action_type = 'vote'
       GROUP BY target_player_id
       ORDER BY votes DESC`
    )
    .bind(gameRow.id, gameRow.round)
    .all<{ target_player_id: string; votes: number }>();

  if (voteCounts.length === 0) return; // No votes cast

  const maxVotes = voteCounts[0].votes;
  const tiedPlayers = voteCounts.filter((v) => v.votes === maxVotes);

  if (tiedPlayers.length === 1) {
    // Clear elimination
    const eliminatedPlayerId = tiedPlayers[0].target_player_id;
    await db
      .prepare("UPDATE game_players SET is_alive = 0 WHERE game_id = ? AND player_id = ?")
      .bind(gameRow.id, eliminatedPlayerId)
      .run();

    const eliminatedPlayer = await db
      .prepare("SELECT nickname FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(gameRow.id, eliminatedPlayerId)
      .first<{ nickname: string }>();

    // Send elimination message
    const { results: allPlayers } = await db
      .prepare("SELECT player_id FROM game_players WHERE game_id = ?")
      .bind(gameRow.id)
      .all<{ player_id: string }>();

    const eliminationMsg = `${eliminatedPlayer?.nickname || "Unknown"} został wyeliminowany w głosowaniu.`;

    const messagePromises = allPlayers.map((player) =>
      db
        .prepare(
          "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
        )
        .bind(
          crypto.randomUUID(),
          gameRow.id,
          hostPlayer.player_id,
          player.player_id,
          eliminationMsg,
          now()
        )
        .run()
    );

    await Promise.all(messagePromises);
  }
  // If tied, no elimination happens (could add tiebreaker logic here)
}

export async function checkWinConditions(db: D1Database, gameId: string): Promise<string | null> {
  const { results: alive } = await db
    .prepare("SELECT role FROM game_players WHERE game_id = ? AND is_alive = 1 AND is_host = 0")
    .bind(gameId)
    .all<{ role: string }>();

  const aliveMafia = alive.filter((p) => p.role === "mafia").length;
  const aliveGood = alive.filter((p) => p.role !== "mafia").length;

  if (aliveMafia === 0) return "town"; // All mafia eliminated
  if (aliveMafia >= aliveGood) return "mafia"; // Mafia equal or outnumber good

  return null; // Game continues
}

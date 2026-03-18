import type { D1Database, GameRow, GamePlayerRow } from "@/db/types";
import { nanoid } from "@/db/helpers";
import { checkWinConditions } from "./phase";

export async function setupPlayer(
  db: D1Database,
  token: string,
  _nickname: string,
  characterId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.status !== "lobby")
    return { success: false, error: "Nie można zmieniać postaci po rozpoczęciu gry" };

  // Check if character exists and is active
  const character = await db
    .prepare("SELECT * FROM characters WHERE id = ? AND is_active = 1")
    .bind(characterId)
    .first();

  if (!character) return { success: false, error: "Nieprawidłowa postać" };

  // Check if character is available
  const { results: existingCharacter } = await db
    .prepare("SELECT COUNT(*) as count FROM game_players WHERE game_id = ? AND character_id = ?")
    .bind(playerRow.game_id, characterId)
    .all<{ count: number }>();

  if (existingCharacter[0]?.count > 0) {
    return { success: false, error: "Ta postać jest już zajęta" };
  }

  await db
    .prepare("UPDATE game_players SET character_id = ? WHERE token = ?")
    .bind(characterId, token)
    .run();

  return { success: true };
}

export async function renamePlayer(
  db: D1Database,
  token: string,
  newNickname: string
): Promise<{ success: boolean; error?: string }> {
  if (!newNickname.trim()) return { success: false, error: "Nowy nick nie może być pusty" };

  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return { success: false, error: "Gra nie istnieje" };
  if (gameRow.status !== "lobby")
    return { success: false, error: "Nie można zmieniać nicku po rozpoczęciu gry" };

  try {
    await db
      .prepare("UPDATE game_players SET nickname = ? WHERE token = ?")
      .bind(newNickname.trim(), token)
      .run();

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { success: false, error: "Gracz o takim nicku już istnieje w tej grze" };
    }
    throw error;
  }
}

export async function kickPlayer(
  db: D1Database,
  token: string,
  targetPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może wyrzucać graczy" };

  const targetRow = await db
    .prepare("SELECT * FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, targetPlayerId)
    .first<GamePlayerRow>();

  if (!targetRow) return { success: false, error: "Gracz nie istnieje" };
  if (targetRow.is_host) return { success: false, error: "Nie można wyrzucić MG" };

  await db
    .prepare("DELETE FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, targetPlayerId)
    .run();

  return { success: true };
}

export async function leaveGame(
  db: D1Database,
  token: string
): Promise<{ success: boolean; error?: string; gameEnded?: boolean }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };
  if (playerRow.is_host) return { success: false, error: "MG nie może opuścić gry" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return { success: false, error: "Gra nie istnieje" };

  if (gameRow.status === "playing") {
    // Mark player as dead instead of removing
    await db.prepare("UPDATE game_players SET is_alive = 0 WHERE token = ?").bind(token).run();

    // Check win conditions
    const winner = await checkWinConditions(db, playerRow.game_id);
    if (winner) {
      await db
        .prepare("UPDATE games SET status = 'finished', phase = 'ended', winner = ? WHERE id = ?")
        .bind(winner, playerRow.game_id)
        .run();
      return { success: true, gameEnded: true };
    }
  } else {
    // Remove player if game hasn't started
    await db.prepare("DELETE FROM game_players WHERE token = ?").bind(token).run();
  }

  return { success: true, gameEnded: false };
}

export async function transferGm(
  db: D1Database,
  token: string,
  newGmPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może przekazać kontrolę" };

  const targetRow = await db
    .prepare("SELECT * FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, newGmPlayerId)
    .first<GamePlayerRow>();

  if (!targetRow) return { success: false, error: "Nowy MG nie istnieje" };
  if (targetRow.is_host) return { success: false, error: "Ten gracz już jest MG" };

  const gameRow = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<GameRow>();

  if (!gameRow) return { success: false, error: "Gra nie istnieje" };

  await db.batch([
    db
      .prepare("UPDATE game_players SET is_host = 0, role = ? WHERE token = ?")
      .bind(gameRow.status === "playing" ? "civilian" : null, token),
    db
      .prepare("UPDATE game_players SET is_host = 1, role = ?, token = ? WHERE player_id = ?")
      .bind(gameRow.status === "playing" ? "gm" : null, nanoid(), newGmPlayerId),
    db
      .prepare("UPDATE games SET host_player_id = ? WHERE id = ?")
      .bind(newGmPlayerId, playerRow.game_id),
  ]);

  return { success: true };
}

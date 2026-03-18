import type { D1Database, GamePlayerRow } from "@/db/types";
import { now, nanoid } from "@/db/helpers";

export async function sendMessage(
  db: D1Database,
  token: string,
  content: string,
  toPlayerId?: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };

  if (!content.trim()) return { success: false, error: "Wiadomość nie może być pusta" };

  // Validate target player if specified
  if (toPlayerId) {
    const targetRow = await db
      .prepare("SELECT * FROM game_players WHERE game_id = ? AND player_id = ?")
      .bind(playerRow.game_id, toPlayerId)
      .first<GamePlayerRow>();

    if (!targetRow) return { success: false, error: "Odbiorca nie istnieje" };
  }

  await db
    .prepare(
      "INSERT INTO messages (id, game_id, from_player_id, to_player_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      playerRow.player_id,
      toPlayerId || null,
      content.trim(),
      now()
    )
    .run();

  return { success: true };
}

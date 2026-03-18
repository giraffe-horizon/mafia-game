import type { D1Database, CharacterRow, GamePlayerRow } from "@/db/types";

export async function getCharacters(db: D1Database): Promise<CharacterRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM characters WHERE is_active = 1 ORDER BY sort_order ASC")
    .bind()
    .all<CharacterRow>();

  return results;
}

export async function updateCharacter(
  db: D1Database,
  token: string,
  characterId: string
): Promise<boolean> {
  // Validate that the character exists and is active
  const character = await db
    .prepare("SELECT id FROM characters WHERE id = ? AND is_active = 1")
    .bind(characterId)
    .first<{ id: string }>();
  if (!character) return false;

  // Find the player by token
  const player = await db
    .prepare("SELECT game_id, player_id FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string; player_id: string }>();
  if (!player) return false;

  // Update the character
  await db
    .prepare("UPDATE game_players SET character_id = ? WHERE token = ?")
    .bind(characterId, token)
    .run();

  return true;
}

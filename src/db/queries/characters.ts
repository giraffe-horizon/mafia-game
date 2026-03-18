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
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };

  // Check if character exists and is active
  const character = await db
    .prepare("SELECT * FROM characters WHERE id = ? AND is_active = 1")
    .bind(characterId)
    .first<CharacterRow>();

  if (!character) return { success: false, error: "Postać nie istnieje lub jest nieaktywna" };

  // Check if character is already taken by another player in this game
  const { results: existingAssignment } = await db
    .prepare(
      "SELECT COUNT(*) as count FROM game_players WHERE game_id = ? AND character_id = ? AND player_id != ?"
    )
    .bind(playerRow.game_id, characterId, playerRow.player_id)
    .all<{ count: number }>();

  if (existingAssignment[0]?.count > 0) {
    return { success: false, error: "Ta postać jest już zajęta przez innego gracza" };
  }

  await db
    .prepare("UPDATE game_players SET character_id = ? WHERE token = ?")
    .bind(characterId, token)
    .run();

  return { success: true };
}

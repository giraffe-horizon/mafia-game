import type { D1Database, GamePlayerRow } from "@/db/types";
import { now, nanoid } from "@/db/helpers";

export async function createMission(
  db: D1Database,
  token: string,
  playerId: string,
  description: string,
  isSecret: boolean,
  points?: number
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może tworzyć misje" };

  const targetRow = await db
    .prepare("SELECT * FROM game_players WHERE game_id = ? AND player_id = ?")
    .bind(playerRow.game_id, playerId)
    .first<GamePlayerRow>();

  if (!targetRow) return { success: false, error: "Gracz nie istnieje" };
  if (targetRow.is_host) return { success: false, error: "Nie można przypisać misji MG" };

  if (!description.trim()) return { success: false, error: "Opis misji nie może być pusty" };

  await db
    .prepare(
      "INSERT INTO missions (id, game_id, player_id, description, is_secret, is_completed, points, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
    )
    .bind(
      nanoid(),
      playerRow.game_id,
      playerId,
      description.trim(),
      isSecret ? 1 : 0,
      points ?? null,
      now()
    )
    .run();

  return { success: true };
}

export async function completeMission(
  db: D1Database,
  token: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow) return { success: false, error: "Nieprawidłowy token gracza" };

  const mission = await db
    .prepare("SELECT * FROM missions WHERE id = ? AND player_id = ?")
    .bind(missionId, playerRow.player_id)
    .first<{ id: string; is_completed: number }>();

  if (!mission) return { success: false, error: "Misja nie istnieje lub nie należy do Ciebie" };
  if (mission.is_completed) return { success: false, error: "Misja jest już ukończona" };

  await db.prepare("UPDATE missions SET is_completed = 1 WHERE id = ?").bind(missionId).run();

  return { success: true };
}

export async function deleteMission(
  db: D1Database,
  token: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  const playerRow = await db
    .prepare("SELECT * FROM game_players WHERE token = ?")
    .bind(token)
    .first<GamePlayerRow>();

  if (!playerRow?.is_host) return { success: false, error: "Tylko MG może usuwać misje" };

  const mission = await db
    .prepare("SELECT * FROM missions WHERE id = ? AND game_id = ?")
    .bind(missionId, playerRow.game_id)
    .first<{ id: string }>();

  if (!mission) return { success: false, error: "Misja nie istnieje" };

  await db.prepare("DELETE FROM missions WHERE id = ?").bind(missionId).run();

  return { success: true };
}

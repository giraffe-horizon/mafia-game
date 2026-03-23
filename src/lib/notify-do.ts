import type { D1Database } from "@/db";

/**
 * Resolve game_id from a player token and notify the DO.
 * Convenience wrapper for routes that only have the token available.
 */
export async function notifyByToken(db: D1Database, token: string): Promise<void> {
  const row = await db
    .prepare("SELECT game_id FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string }>();
  if (row?.game_id) await notifyDO(row.game_id);
}

/**
 * Best-effort notification to the Durable Object WebSocket worker.
 * Used by API routes (timer, phase transitions) to trigger immediate
 * state broadcasts to connected WebSocket clients.
 *
 * Returns a Promise so callers can await it (important on CF Workers where
 * unawaited fetches may be killed when the response is sent).
 */
export async function notifyDO(gameId: string): Promise<void> {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  const secret = process.env.WS_NOTIFY_SECRET ?? process.env.NOTIFY_SECRET;

  if (!wsUrl || !secret) return;

  try {
    await fetch(`${wsUrl}/notify?gameId=${encodeURIComponent(gameId)}`, {
      method: "POST",
      headers: { "X-Notify-Secret": secret },
    });
  } catch {
    // Intentionally swallowed — WS layer is best-effort
  }
}

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

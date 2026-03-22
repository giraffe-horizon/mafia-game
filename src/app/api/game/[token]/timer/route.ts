import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { notifyDO } from "@/lib/notify-do";

export const dynamic = "force-dynamic";

const setTimerSchema = z.object({
  durationSeconds: z.number().int().positive().max(600),
});

export const POST = withApiHandler(async (req, { db, token }) => {
  const body = await req.json();
  const { durationSeconds } = setTimerSchema.parse(body);

  // Auth: only host can set timer
  const playerRow = await db
    .prepare("SELECT game_id, is_host FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string; is_host: number }>();

  if (!playerRow?.is_host) {
    return NextResponse.json({ error: "Tylko MG może ustawić timer" }, { status: 403 });
  }

  const gameRow = await db
    .prepare("SELECT status, phase FROM games WHERE id = ?")
    .bind(playerRow.game_id)
    .first<{ status: string; phase: string }>();

  if (!gameRow || gameRow.status !== "playing") {
    return NextResponse.json({ error: "Gra nie trwa" }, { status: 400 });
  }

  const deadline = new Date(Date.now() + durationSeconds * 1000).toISOString();

  await db
    .prepare("UPDATE games SET phase_deadline = ? WHERE id = ?")
    .bind(deadline, playerRow.game_id)
    .run();

  notifyDO(playerRow.game_id);

  return NextResponse.json({ success: true, deadline });
});

export const DELETE = withApiHandler(async (_req, { db, token }) => {
  const playerRow = await db
    .prepare("SELECT game_id, is_host FROM game_players WHERE token = ?")
    .bind(token)
    .first<{ game_id: string; is_host: number }>();

  if (!playerRow?.is_host) {
    return NextResponse.json({ error: "Tylko MG może usunąć timer" }, { status: 403 });
  }

  await db
    .prepare("UPDATE games SET phase_deadline = NULL WHERE id = ?")
    .bind(playerRow.game_id)
    .run();

  notifyDO(playerRow.game_id);

  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { kickPlayerSchema } from "@/lib/api/schemas";
import { kickPlayer } from "@/db";
import { notifyByToken } from "@/lib/notify-do";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { playerId } = kickPlayerSchema.parse(body);

  const result = await kickPlayer(db, token, playerId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  await notifyByToken(db, token);
  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { leaveGame } from "@/db";
import { notifyByToken } from "@/lib/notify-do";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const result = await leaveGame(db, token);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await notifyByToken(db, token);
  return NextResponse.json({ success: true, gameEnded: result.gameEnded });
});

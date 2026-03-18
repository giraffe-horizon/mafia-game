import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { kickPlayer } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { playerId } = await req.json();
  if (!playerId) return NextResponse.json({ error: "Podaj gracza" }, { status: 400 });
  const result = await kickPlayer(db, token, playerId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
});

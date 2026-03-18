import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { kickPlayerSchema } from "@/app/api/lib/schemas";
import { kickPlayer } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { playerId } = kickPlayerSchema.parse(body);

  const result = await kickPlayer(db, token, playerId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
});

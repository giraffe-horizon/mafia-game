import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { setupPlayerSchema } from "@/lib/api/schemas";
import { setupPlayer } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { nickname, characterId } = setupPlayerSchema.parse(body);

  const result = await setupPlayer(db, token, nickname, characterId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
});

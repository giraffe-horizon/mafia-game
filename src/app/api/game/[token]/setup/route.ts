import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { setupPlayerSchema } from "@/app/api/lib/schemas";
import { setupPlayer } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { nickname, characterId } = setupPlayerSchema.parse(body);

  const result = await setupPlayer(db, token, nickname, characterId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
});

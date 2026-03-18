import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { setupPlayer } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { nickname, characterId } = await req.json();

  if (!nickname || !characterId) {
    return NextResponse.json({ error: "Brakuje nazwy lub postaci" }, { status: 400 });
  }

  const result = await setupPlayer(db, token, nickname, characterId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
});

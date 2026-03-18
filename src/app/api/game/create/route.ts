import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/app/api/lib/handler";
import { createGame } from "@/lib/db";

export const POST = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const { nickname, characterId } = await req.json();
  const { token } = await createGame(db, nickname, characterId);
  return NextResponse.json({ token });
});

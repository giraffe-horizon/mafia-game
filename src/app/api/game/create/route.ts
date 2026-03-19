import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/lib/api/handler";
import { createGameSchema } from "@/lib/api/schemas";
import { createGame } from "@/db";

export const POST = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const body = await req.json();
  const { nickname, characterId } = createGameSchema.parse(body);
  const { token } = await createGame(db, nickname, characterId);
  return NextResponse.json({ token });
});

import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/app/api/lib/handler";
import { createGameSchema } from "@/app/api/lib/schemas";
import { createGame } from "@/lib/db";

export const POST = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const body = await req.json();
  const { nickname, characterId } = createGameSchema.parse(body);
  const { token } = await createGame(db, nickname, characterId);
  return NextResponse.json({ token });
});

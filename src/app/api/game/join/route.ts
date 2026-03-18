import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/app/api/lib/handler";
import { joinGameSchema } from "@/app/api/lib/schemas";
import { joinGame } from "@/db";

export const POST = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const body = await req.json();
  const { code, nickname, characterId } = joinGameSchema.parse(body);

  const result = await joinGame(db, code, nickname, characterId);
  if (!result) {
    return NextResponse.json(
      { error: "Nie znaleziono gry lub gra już się toczy" },
      { status: 404 }
    );
  }
  return NextResponse.json({ token: result.token });
});

import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/app/api/lib/handler";
import { joinGame } from "@/lib/db";

export const POST = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  let body;
  try {
    body = await req.json();
  } catch (jsonError) {
    console.error("Failed to parse request body:", jsonError);
    return NextResponse.json({ error: "Niepoprawny format danych" }, { status: 400 });
  }

  const { code, nickname, characterId } = body;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Podaj kod sesji" }, { status: 400 });
  }

  const result = await joinGame(db, code, nickname, characterId);
  if (!result) {
    return NextResponse.json(
      { error: "Nie znaleziono gry lub gra już się toczy" },
      { status: 404 }
    );
  }
  return NextResponse.json({ token: result.token });
});

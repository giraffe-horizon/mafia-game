import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { updateCharacter } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { characterId } = await req.json();
  if (!characterId || typeof characterId !== "string") {
    return NextResponse.json({ error: "Nieprawidłowy ID postaci" }, { status: 400 });
  }

  const success = await updateCharacter(db, token, characterId);
  if (!success) {
    return NextResponse.json({ error: "Nie udało się zaktualizować postaci" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
});

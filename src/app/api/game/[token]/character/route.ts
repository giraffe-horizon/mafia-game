import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { updateCharacterSchema } from "@/lib/api/schemas";
import { updateCharacter } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { characterId } = updateCharacterSchema.parse(body);

  const success = await updateCharacter(db, token, characterId);
  if (!success) {
    return NextResponse.json({ error: "Nie udało się zaktualizować postaci" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
});

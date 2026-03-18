import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { updateCharacterSchema } from "@/app/api/lib/schemas";
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

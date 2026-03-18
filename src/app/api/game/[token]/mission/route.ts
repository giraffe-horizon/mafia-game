import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { createMission } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { targetPlayerId, description, isSecret, points } = await req.json();
  if (!targetPlayerId || typeof targetPlayerId !== "string") {
    return NextResponse.json({ error: "Podaj ID gracza" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim().length < 1) {
    return NextResponse.json({ error: "Podaj opis misji" }, { status: 400 });
  }
  const result = await createMission(
    db,
    token,
    targetPlayerId,
    description,
    !!isSecret,
    typeof points === "number" ? points : 0
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

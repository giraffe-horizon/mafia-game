import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { getGameState } from "@/lib/db";

export const GET = withApiHandler(async (req: NextRequest, { db, token }) => {
  const state = await getGameState(db, token);
  if (!state) {
    return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
  }
  return NextResponse.json(state);
});

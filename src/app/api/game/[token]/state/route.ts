import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { getGameState } from "@/db";

export const GET = withApiHandler(async (req: NextRequest, { db, token }) => {
  const state = await getGameState(db, token);
  if (!state) {
    return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
  }
  return NextResponse.json(state);
});

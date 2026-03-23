import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { getRanking } from "@/db/queries/ranking";

export const GET = withApiHandler(async (_req: NextRequest, { db, token }) => {
  const result = await getRanking(db, token);
  if (!result) {
    return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
  }

  return NextResponse.json(result);
});

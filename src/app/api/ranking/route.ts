import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/app/api/lib/handler";
import { getRanking } from "@/db/queries/ranking";

export const GET = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Podaj token" }, { status: 400 });
  }

  const result = await getRanking(db, token);
  if (!result) {
    return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
  }

  return NextResponse.json(result);
});

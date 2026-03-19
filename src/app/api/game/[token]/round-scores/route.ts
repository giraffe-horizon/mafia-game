import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { getRoundScores } from "@/db";

export const GET = withApiHandler(async (_req, { db, token }) => {
  const result = await getRoundScores(db, token);

  if (!result) {
    return NextResponse.json({ scores: [], round: 0, winner: null });
  }

  return NextResponse.json(result);
});

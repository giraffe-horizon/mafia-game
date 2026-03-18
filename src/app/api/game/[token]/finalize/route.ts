import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { finalizeGame } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const result = await finalizeGame(db, token);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

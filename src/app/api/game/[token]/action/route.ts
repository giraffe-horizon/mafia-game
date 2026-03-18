import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { submitAction } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { type, targetPlayerId, forPlayerId } = await req.json();
  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "Podaj typ akcji" }, { status: 400 });
  }
  const result = await submitAction(db, token, type, targetPlayerId, forPlayerId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

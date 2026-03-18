import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { transferGm } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { newHostPlayerId } = await req.json();
  if (!newHostPlayerId || typeof newHostPlayerId !== "string") {
    return NextResponse.json({ error: "Podaj ID nowego MG" }, { status: 400 });
  }
  const result = await transferGm(db, token, newHostPlayerId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

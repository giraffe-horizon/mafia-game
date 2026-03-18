import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { sendMessage } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { content, toPlayerId } = await req.json();
  if (!content || typeof content !== "string" || content.trim().length < 1) {
    return NextResponse.json({ error: "Podaj treść wiadomości" }, { status: 400 });
  }
  const result = await sendMessage(db, token, content, toPlayerId ?? undefined);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

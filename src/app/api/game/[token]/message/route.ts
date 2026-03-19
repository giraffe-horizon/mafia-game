import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { messageSchema } from "@/lib/api/schemas";
import { sendMessage } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { content, toPlayerId } = messageSchema.parse(body);

  const result = await sendMessage(db, token, content, toPlayerId ?? undefined);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

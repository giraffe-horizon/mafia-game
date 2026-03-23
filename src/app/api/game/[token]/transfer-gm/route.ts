import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { transferGmSchema } from "@/lib/api/schemas";
import { transferGm } from "@/db";
import { notifyByToken } from "@/lib/notify-do";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { newHostPlayerId } = transferGmSchema.parse(body);

  const result = await transferGm(db, token, newHostPlayerId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await notifyByToken(db, token);
  return NextResponse.json({ success: true });
});

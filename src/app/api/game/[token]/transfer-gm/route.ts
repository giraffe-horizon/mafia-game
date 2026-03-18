import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { transferGmSchema } from "@/app/api/lib/schemas";
import { transferGm } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { newHostPlayerId } = transferGmSchema.parse(body);

  const result = await transferGm(db, token, newHostPlayerId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

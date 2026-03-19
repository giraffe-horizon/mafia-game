import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { actionSchema } from "@/lib/api/schemas";
import { submitAction } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { type, targetPlayerId, forPlayerId } = actionSchema.parse(body);

  const result = await submitAction(db, token, type, targetPlayerId, forPlayerId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

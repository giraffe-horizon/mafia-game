import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { actionSchema } from "@/app/api/lib/schemas";
import { submitAction } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { type, targetPlayerId, forPlayerId } = actionSchema.parse(body);

  const result = await submitAction(db, token, type, targetPlayerId, forPlayerId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

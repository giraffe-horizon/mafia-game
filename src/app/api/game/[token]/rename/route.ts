import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { renamePlayerSchema } from "@/lib/api/schemas";
import { renamePlayer } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { nickname } = renamePlayerSchema.parse(body);

  const result = await renamePlayer(db, token, nickname.trim());
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

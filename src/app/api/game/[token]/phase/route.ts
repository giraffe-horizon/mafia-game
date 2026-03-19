import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { phaseSchema } from "@/lib/api/schemas";
import { changePhase, type GamePhase } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { phase } = phaseSchema.parse(body);

  const result = await changePhase(db, token, phase as GamePhase);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

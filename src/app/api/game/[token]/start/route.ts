import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/handler";
import { startGameSchema } from "@/lib/api/schemas";
import { startGame } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  let mafiaCount: number | undefined;
  let mode: "full" | "simple" = "full";

  try {
    const body = await req.json();
    const validatedData = startGameSchema.parse(body);
    mafiaCount = validatedData.mafiaCount;
    mode = validatedData.mode ?? "full";
  } catch {
    // no body = use defaults
  }

  const result = await startGame(db, token, mafiaCount, mode);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

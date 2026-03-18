import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { startGame } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  let mafiaCount: number | undefined;
  let mode: "full" | "simple" = "full";
  try {
    const body = await req.json();
    if (body.mafiaCount && typeof body.mafiaCount === "number") {
      mafiaCount = body.mafiaCount;
    }
    if (body.mode === "simple") {
      mode = "simple";
    }
  } catch {
    // no body = use defaults
  }

  const result = await startGame(db, token, mafiaCount, mode);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { rematch } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  let mafiaCount: number | undefined;
  let mode: "full" | "simple" | undefined;
  try {
    const body = await req.json();
    if (typeof body?.mafiaCount === "number" && body.mafiaCount > 0) {
      mafiaCount = body.mafiaCount;
    }
    if (body?.mode === "simple") mode = "simple";
    else if (body?.mode === "full") mode = "full";
  } catch {
    /* no body */
  }

  const result = await rematch(db, token, mafiaCount, mode);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

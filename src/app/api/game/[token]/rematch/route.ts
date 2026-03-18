import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { rematchSchema } from "@/app/api/lib/schemas";
import { rematch } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  let mafiaCount: number | undefined;
  let mode: "full" | "simple" | undefined;

  try {
    const body = await req.json();
    const validatedData = rematchSchema.parse(body);
    mafiaCount = validatedData.mafiaCount;
    mode = validatedData.mode;
  } catch {
    /* no body or validation failed - use defaults */
  }

  const result = await rematch(db, token, mafiaCount, mode);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, newToken: result.newToken });
});

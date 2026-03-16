export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { startGame, type D1Database } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { env } = getRequestContext();
  const db = (env as unknown as { DB: D1Database }).DB;

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
}

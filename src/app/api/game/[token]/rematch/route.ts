export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { rematch, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;

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
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

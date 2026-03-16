export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { kickPlayer, type D1Database } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const { playerId } = await req.json();
    if (!playerId) return NextResponse.json({ error: "Podaj gracza" }, { status: 400 });
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;
    const result = await kickPlayer(db, token, playerId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

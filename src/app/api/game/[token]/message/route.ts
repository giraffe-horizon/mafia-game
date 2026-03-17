export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendMessage, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { content, toPlayerId } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length < 1) {
      return NextResponse.json({ error: "Podaj treść wiadomości" }, { status: 400 });
    }
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;
    const result = await sendMessage(db, token, content, toPlayerId ?? undefined);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

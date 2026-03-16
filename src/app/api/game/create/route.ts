export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createGame, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json();
    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1) {
      return NextResponse.json({ error: "Podaj imię" }, { status: 400 });
    }
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;
    const { token } = await createGame(db, nickname);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

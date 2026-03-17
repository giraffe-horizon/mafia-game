import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGame, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { nickname, characterId } = await req.json();
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const { token } = await createGame(db, nickname, characterId);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

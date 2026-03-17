import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { joinGame, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { code, nickname, characterId } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Podaj kod sesji" }, { status: 400 });
    }
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await joinGame(db, code, nickname, characterId);
    if (!result) {
      return NextResponse.json(
        { error: "Nie znaleziono gry lub gra już się toczy" },
        { status: 404 }
      );
    }
    return NextResponse.json({ token: result.token });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

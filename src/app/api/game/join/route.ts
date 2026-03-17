import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { joinGame, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error("Failed to parse request body:", jsonError);
      return NextResponse.json({ error: "Niepoprawny format danych" }, { status: 400 });
    }

    const { code, nickname, characterId } = body;
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
  } catch (error) {
    console.error("Join game error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

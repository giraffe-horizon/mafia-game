import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCharacters, type D1Database } from "@/lib/db";

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const characters = await getCharacters(db);
    return NextResponse.json(characters);
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

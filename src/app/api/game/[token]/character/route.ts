import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { updateCharacter, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { characterId } = await req.json();
    if (!characterId || typeof characterId !== "string") {
      return NextResponse.json({ error: "Nieprawidłowy ID postaci" }, { status: 400 });
    }

    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;

    const resolvedParams = await params;
    const success = await updateCharacter(db, resolvedParams.token, characterId);
    if (!success) {
      return NextResponse.json({ error: "Nie udało się zaktualizować postaci" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

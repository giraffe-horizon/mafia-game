import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createMission, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { targetPlayerId, description, isSecret, points } = await req.json();
    if (!targetPlayerId || typeof targetPlayerId !== "string") {
      return NextResponse.json({ error: "Podaj ID gracza" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 1) {
      return NextResponse.json({ error: "Podaj opis misji" }, { status: 400 });
    }
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await createMission(
      db,
      token,
      targetPlayerId,
      description,
      !!isSecret,
      typeof points === "number" ? points : 0
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

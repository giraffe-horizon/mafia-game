import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { changePhase, type D1Database, type GamePhase } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { phase } = await req.json();
    if (!phase) return NextResponse.json({ error: "Podaj fazę" }, { status: 400 });
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await changePhase(db, token, phase as GamePhase);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

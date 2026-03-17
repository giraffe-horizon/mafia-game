import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { submitAction, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { type, targetPlayerId, forPlayerId } = await req.json();
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Podaj typ akcji" }, { status: 400 });
    }
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await submitAction(db, token, type, targetPlayerId, forPlayerId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

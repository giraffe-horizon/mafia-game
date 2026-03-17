import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { transferGm, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { newHostPlayerId } = await req.json();
    if (!newHostPlayerId || typeof newHostPlayerId !== "string") {
      return NextResponse.json({ error: "Podaj ID nowego MG" }, { status: 400 });
    }
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await transferGm(db, token, newHostPlayerId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

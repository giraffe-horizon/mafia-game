import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { setupPlayer, type D1Database } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = await getCloudflareContext();
  const db = (env as { DB: D1Database }).DB;

  const { nickname, characterId } = await req.json();

  if (!nickname || !characterId) {
    return NextResponse.json({ error: "Brakuje nazwy lub postaci" }, { status: 400 });
  }

  const result = await setupPlayer(db, token, nickname, characterId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

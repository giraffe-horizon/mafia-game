import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { completeMission, type D1Database } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; missionId: string }> }
) {
  const { token, missionId } = await params;
  try {
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await completeMission(db, token, missionId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

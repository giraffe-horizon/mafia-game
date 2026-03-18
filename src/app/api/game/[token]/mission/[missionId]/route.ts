import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { deleteMission, type D1Database } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; missionId: string }> }
) {
  try {
    const { token, missionId } = await params;
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;
    const result = await deleteMission(db, token, missionId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`API Error [${req.method} ${req.nextUrl.pathname}]:`, error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

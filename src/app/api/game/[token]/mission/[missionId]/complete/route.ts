export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { completeMission, type D1Database } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; missionId: string }> }
) {
  const { token, missionId } = await params;
  try {
    const { env } = getRequestContext();
    const db = (env as unknown as { DB: D1Database }).DB;
    const result = await completeMission(db, token, missionId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

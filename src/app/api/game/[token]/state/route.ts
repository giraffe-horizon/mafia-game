export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getGameState, type D1Database } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = getRequestContext();
  const db = (env as unknown as { DB: D1Database }).DB;
  const state = await getGameState(db, token);
  if (!state) {
    return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
  }
  return NextResponse.json(state);
}

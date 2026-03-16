import { NextRequest, NextResponse } from "next/server";
import { getGameState } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const state = getGameState(token);
  if (!state) {
    return NextResponse.json({ error: "Nie znaleziono sesji" }, { status: 404 });
  }
  return NextResponse.json(state);
}

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { startGame } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = startGame(token);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

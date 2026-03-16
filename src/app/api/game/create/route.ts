export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createGame } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json();
    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1) {
      return NextResponse.json({ error: "Podaj imię" }, { status: 400 });
    }
    const { hostPlayer } = createGame(nickname.trim());
    return NextResponse.json({ token: hostPlayer.token });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

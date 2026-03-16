import { NextRequest, NextResponse } from "next/server";
import { joinGame } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { code, nickname } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Podaj kod sesji" }, { status: 400 });
    }
    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1) {
      return NextResponse.json({ error: "Podaj imię" }, { status: 400 });
    }
    const result = joinGame(code, nickname.trim());
    if (!result) {
      return NextResponse.json(
        { error: "Nie znaleziono gry lub gra już się toczy" },
        { status: 404 }
      );
    }
    return NextResponse.json({ token: result.player.token });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

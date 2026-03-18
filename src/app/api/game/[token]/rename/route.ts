import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { renamePlayer } from "@/lib/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const { nickname } = await req.json();
  if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1) {
    return NextResponse.json({ error: "Podaj nazwę gracza" }, { status: 400 });
  }
  if (nickname.trim().length > 20) {
    return NextResponse.json(
      { error: "Nazwa gracza może mieć maksymalnie 20 znaków" },
      { status: 400 }
    );
  }
  const result = await renamePlayer(db, token, nickname.trim());
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

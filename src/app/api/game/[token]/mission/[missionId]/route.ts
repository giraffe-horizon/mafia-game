import { NextRequest, NextResponse } from "next/server";
import { deleteMission } from "@/lib/db";
import { withApiHandlerMission } from "@/app/api/lib/handler";

export const DELETE = withApiHandlerMission(async (_req: NextRequest, { db, token, missionId }) => {
  const result = await deleteMission(db, token, missionId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

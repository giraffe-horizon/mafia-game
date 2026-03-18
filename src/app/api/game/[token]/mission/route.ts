import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/app/api/lib/handler";
import { createMissionSchema } from "@/app/api/lib/schemas";
import { createMission } from "@/db";

export const POST = withApiHandler(async (req: NextRequest, { db, token }) => {
  const body = await req.json();
  const { targetPlayerId, description, isSecret, points } = createMissionSchema.parse(body);

  const result = await createMission(
    db,
    token,
    targetPlayerId,
    description,
    !!isSecret,
    typeof points === "number" ? points : 0
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

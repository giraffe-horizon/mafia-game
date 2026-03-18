import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/app/api/lib/handler";
import { getCharacters } from "@/lib/db";

export const GET = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const characters = await getCharacters(db);
  return NextResponse.json(characters);
});

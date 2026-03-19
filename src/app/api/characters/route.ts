import { NextRequest, NextResponse } from "next/server";
import { withApiHandlerNoToken } from "@/lib/api/handler";
import { getCharacters } from "@/db";

export const GET = withApiHandlerNoToken(async (req: NextRequest, { db }) => {
  const characters = await getCharacters(db);
  return NextResponse.json(characters);
});

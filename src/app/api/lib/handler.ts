import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "./db";
import type { D1Database } from "@/lib/db";

export interface ApiContext {
  db: D1Database;
}

export interface ApiContextWithToken extends ApiContext {
  token: string;
}

export type ApiHandler<T = any> = (req: NextRequest, ctx: ApiContext) => Promise<NextResponse<T>>;
export type ApiHandlerWithToken<T = any> = (
  req: NextRequest,
  ctx: ApiContextWithToken
) => Promise<NextResponse<T>>;

export function withApiHandlerNoToken(
  handler: (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const db = await getDb();
      return await handler(req, { db });
    } catch (error) {
      console.error(`API Error [${req.method} ${req.nextUrl.pathname}]:`, error);

      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
      }

      return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
  };
}

export interface ApiContextWithTokenAndMissionId extends ApiContextWithToken {
  missionId: string;
}

export function withApiHandlerMission(
  handler: (req: NextRequest, ctx: ApiContextWithTokenAndMissionId) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<{ token: string; missionId: string }> }
  ) => {
    try {
      const { token, missionId } = await params;
      const db = await getDb();
      return await handler(req, { db, token, missionId });
    } catch (error) {
      console.error(`API Error [${req.method} ${req.nextUrl.pathname}]:`, error);

      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
      }

      return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
  };
}

export function withApiHandler(
  handler: (req: NextRequest, ctx: ApiContextWithToken) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: Promise<{ token: string }> }) => {
    try {
      const { token } = await params;
      const db = await getDb();
      return await handler(req, { db, token });
    } catch (error) {
      console.error(`API Error [${req.method} ${req.nextUrl.pathname}]:`, error);

      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
      }

      return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
  };
}

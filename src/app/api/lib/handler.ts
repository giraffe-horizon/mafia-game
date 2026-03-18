import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "./db";
import type { D1Database } from "@/db";

export interface ApiContext {
  db: D1Database;
}

export interface ApiContextWithToken extends ApiContext {
  token: string;
}

export type ApiHandler<T = unknown> = (
  req: NextRequest,
  ctx: ApiContext
) => Promise<NextResponse<T>>;
export type ApiHandlerWithToken<T = unknown> = (
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
      console.error(
        "API Error [%s %s]:",
        req.method,
        req.nextUrl.pathname,
        req.method,
        req.nextUrl.pathname,
        error instanceof Error ? error.message : error
      );

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
        "API Error [%s %s]:",
        req.method,
        req.nextUrl.pathname,
      console.error(
        "API Error [%s %s]:",
        req.method,
        req.nextUrl.pathname,
        error instanceof Error ? error.message : error
      );

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
        "API Error [%s %s]:",
        req.method,
        req.nextUrl.pathname,
      return await handler(req, { db, token });
    } catch (error) {
      console.error(
        "API Error [%s %s]:",
        req.method,
        req.nextUrl.pathname,
        error instanceof Error ? error.message : error
      );

      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
      }

      return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
  };
}

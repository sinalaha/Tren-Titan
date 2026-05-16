import { NextResponse } from "next/server";

import { prisma } from "@/server/db/client";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        service: "tren-titan",
        db: "up",
        uptimeMs: Date.now() - startedAt
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "tren-titan",
        db: "down",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

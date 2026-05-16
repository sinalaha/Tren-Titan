import { NextResponse } from "next/server";

import { requireAdminApi } from "@/server/auth/requireAdminApi";
import { prisma } from "@/server/db/client";
import { getAdminOverview } from "@/services/adminOverview";

export async function GET() {
  const sessionOrResponse = await requireAdminApi();
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const body = await getAdminOverview(prisma);
  return NextResponse.json(body);
}

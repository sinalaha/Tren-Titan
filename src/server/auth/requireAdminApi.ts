import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";

export async function requireAdminApi(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role ?? "USER";
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return session;
}

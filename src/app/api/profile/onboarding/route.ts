import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { onboardingSchema } from "@/lib/validations/auth.schema";
import { prisma } from "@/server/db/client";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid onboarding data." }, { status: 400 });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { ...parsed.data, onboardingDone: true },
      create: { ...parsed.data, onboardingDone: true, userId: session.user.id }
    });

    return NextResponse.json({ ok: true, profileId: profile.id });
  } catch {
    return NextResponse.json({ message: "Could not save onboarding." }, { status: 500 });
  }
}

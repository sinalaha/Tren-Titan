import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { logError } from "@/lib/observability";
import { registerSchema } from "@/lib/validations/auth.schema";
import { prisma } from "@/server/db/client";
import { assertRegisterRateLimit, getRegistrationClientKey } from "@/services/registerRateLimit";

export async function POST(request: Request) {
  try {
    const clientKey = getRegistrationClientKey(request);
    const limit = await assertRegisterRateLimit(clientKey);
    if (!limit.ok) {
      return NextResponse.json(
        {
          message: "Too many registration attempts. Try again later.",
          retryAfterSec: limit.retryAfterSec
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid registration payload." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ message: "Email is already in use." }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        subscription: {
          create: { plan: "free", status: "FREE", aiScansLimit: 10 }
        }
      },
      select: { id: true, email: true, name: true }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logError("auth.register", error);
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}

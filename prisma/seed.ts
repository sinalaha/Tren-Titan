import { Goal, PrismaClient, Role, SubscriptionStatus } from "@prisma/client";
import { hash } from "bcryptjs";

import { recordQualifyingActivity } from "../src/services/gamification";

const prisma = new PrismaClient();

const SEED_DEMO_EMAIL = "demo@trentitan.app";
const SEED_ADMIN_EMAIL = "admin@trentitan.app";
/** Dev-only password documented in README / team chat — change in production DB. */
const SEED_PASSWORD = "TrenTitanDemo2026!";

async function main() {
  const passwordHash = await hash(SEED_PASSWORD, 12);

  const demo = await prisma.user.upsert({
    where: { email: SEED_DEMO_EMAIL },
    update: { name: "Demo Athlete" },
    create: {
      email: SEED_DEMO_EMAIL,
      name: "Demo Athlete",
      passwordHash,
      role: Role.USER
    }
  });

  await prisma.subscription.upsert({
    where: { userId: demo.id },
    update: { status: SubscriptionStatus.TRIAL },
    create: {
      userId: demo.id,
      plan: "free",
      status: SubscriptionStatus.TRIAL,
      aiScansLimit: 10
    }
  });

  await prisma.profile.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      goal: Goal.MAINTENANCE,
      onboardingDone: true,
      height: 180,
      weight: 80,
      trainingFreq: 4
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { role: Role.ADMIN },
    create: {
      email: SEED_ADMIN_EMAIL,
      name: "Mission Admin",
      passwordHash,
      role: Role.ADMIN
    }
  });

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {
      plan: "premium",
      status: SubscriptionStatus.ACTIVE,
      aiScansLimit: 999
    },
    create: {
      userId: admin.id,
      plan: "premium",
      status: SubscriptionStatus.ACTIVE,
      aiScansLimit: 999
    }
  });

  await prisma.nutritionLog.deleteMany({ where: { userId: demo.id } });
  await prisma.waterLog.deleteMany({ where: { userId: demo.id } });
  await prisma.workout.deleteMany({ where: { userId: demo.id } });

  const now = new Date();
  await prisma.nutritionLog.createMany({
    data: [
      {
        userId: demo.id,
        date: now,
        mealType: "breakfast",
        name: "Oats & protein",
        calories: 520,
        protein: 32,
        fats: 12,
        carbs: 72,
        isManual: true
      },
      {
        userId: demo.id,
        date: now,
        mealType: "lunch",
        name: "Chicken rice bowl",
        calories: 780,
        protein: 48,
        fats: 18,
        carbs: 88,
        isManual: true
      }
    ]
  });

  await prisma.waterLog.create({
    data: { userId: demo.id, date: now, amountMl: 750 }
  });

  await prisma.workout.create({
    data: {
      userId: demo.id,
      name: "Push day (seed)",
      rpe: 8,
      durationMin: 52,
      exercises: {
        create: [
          {
            exercise: "Bench press",
            muscleGroup: "chest",
            setNumber: 1,
            reps: 8,
            weight: 80,
            rpe: 8
          },
          {
            exercise: "Incline dumbbell press",
            muscleGroup: "chest",
            setNumber: 1,
            reps: 10,
            weight: 28,
            rpe: 7
          }
        ]
      }
    }
  });

  await recordQualifyingActivity(prisma, demo.id, "nutrition");
  await recordQualifyingActivity(prisma, demo.id, "nutrition");
  await recordQualifyingActivity(prisma, demo.id, "workout");

  process.stdout.write(
    `[seed] ${SEED_DEMO_EMAIL} + ${SEED_ADMIN_EMAIL} — password: ${SEED_PASSWORD}\n`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e: unknown) => {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    void prisma.$disconnect();
    process.exit(1);
  });

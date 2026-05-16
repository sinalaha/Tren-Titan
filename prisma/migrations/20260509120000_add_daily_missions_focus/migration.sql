-- CreateEnum
CREATE TYPE "DailyMissionsFocus" AS ENUM ('FAT_LOSS', 'MUSCLE_GAIN');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "dailyMissionsFocus" "DailyMissionsFocus" NOT NULL DEFAULT 'FAT_LOSS';

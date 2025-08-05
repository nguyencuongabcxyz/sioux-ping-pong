-- CreateEnum
CREATE TYPE "public"."MatchFormat" AS ENUM ('BO3', 'BO5');

-- CreateEnum
CREATE TYPE "public"."GameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."matches" ADD COLUMN     "awayGamesWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "format" "public"."MatchFormat" NOT NULL DEFAULT 'BO3',
ADD COLUMN     "homeGamesWon" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."games" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_matchId_gameNumber_key" ON "public"."games"("matchId", "gameNumber");

-- AddForeignKey
ALTER TABLE "public"."games" ADD CONSTRAINT "games_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

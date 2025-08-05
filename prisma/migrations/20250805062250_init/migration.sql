-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "tournament_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentTableId" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matches" (
    "id" TEXT NOT NULL,
    "tournamentTableId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_tables_name_key" ON "public"."tournament_tables"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_tournamentTableId_key" ON "public"."teams"("name", "tournamentTableId");

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_tournamentTableId_fkey" FOREIGN KEY ("tournamentTableId") REFERENCES "public"."tournament_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_tournamentTableId_fkey" FOREIGN KEY ("tournamentTableId") REFERENCES "public"."tournament_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

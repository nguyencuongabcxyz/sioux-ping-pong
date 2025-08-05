-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('GROUP_STAGE', 'KNOCKOUT');

-- CreateEnum
CREATE TYPE "public"."KnockoutRound" AS ENUM ('QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- CreateEnum
CREATE TYPE "public"."TournamentPhase" AS ENUM ('GROUP_STAGE', 'KNOCKOUT_STAGE', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "public"."matches" DROP CONSTRAINT "matches_tournamentTableId_fkey";

-- AlterTable
ALTER TABLE "public"."matches" ADD COLUMN     "matchType" "public"."MatchType" NOT NULL DEFAULT 'GROUP_STAGE',
ADD COLUMN     "round" "public"."KnockoutRound",
ADD COLUMN     "roundOrder" INTEGER,
ADD COLUMN     "winnerAdvancesToMatchId" TEXT,
ALTER COLUMN "tournamentTableId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."tournament_stage" (
    "id" TEXT NOT NULL,
    "currentStage" "public"."TournamentPhase" NOT NULL DEFAULT 'GROUP_STAGE',
    "groupStageCompleted" BOOLEAN NOT NULL DEFAULT false,
    "knockoutGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_stage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_tournamentTableId_fkey" FOREIGN KEY ("tournamentTableId") REFERENCES "public"."tournament_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_winnerAdvancesToMatchId_fkey" FOREIGN KEY ("winnerAdvancesToMatchId") REFERENCES "public"."matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

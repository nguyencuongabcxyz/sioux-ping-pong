-- AlterEnum
ALTER TYPE "public"."KnockoutRound" ADD VALUE 'THIRD_PLACE';

-- AlterTable
ALTER TABLE "public"."matches" ADD COLUMN     "predictionsOpen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."match_predictions" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "winningTeamId" TEXT NOT NULL,
    "matchResult" TEXT NOT NULL,
    "losingTeamScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_predictions_companyEmail_matchId_key" ON "public"."match_predictions"("companyEmail", "matchId");

-- AddForeignKey
ALTER TABLE "public"."match_predictions" ADD CONSTRAINT "match_predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."match_predictions" ADD CONSTRAINT "match_predictions_winningTeamId_fkey" FOREIGN KEY ("winningTeamId") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

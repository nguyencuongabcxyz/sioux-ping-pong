-- CreateTable
CREATE TABLE "public"."predictable_teams" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictable_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."final_match_predictions" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "championTeamId" TEXT NOT NULL,
    "matchResult" TEXT NOT NULL,
    "losingTeamScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_match_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "predictable_teams_teamId_key" ON "public"."predictable_teams"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "final_match_predictions_companyEmail_key" ON "public"."final_match_predictions"("companyEmail");

-- AddForeignKey
ALTER TABLE "public"."predictable_teams" ADD CONSTRAINT "predictable_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."final_match_predictions" ADD CONSTRAINT "final_match_predictions_championTeamId_fkey" FOREIGN KEY ("championTeamId") REFERENCES "public"."predictable_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

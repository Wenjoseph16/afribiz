-- CreateEnum
CREATE TYPE "GrowthBriefType" AS ENUM ('MORNING_BRIEF', 'EVENING_SUMMARY');

-- CreateTable
CREATE TABLE "GrowthBrief" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "GrowthBriefType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL,
    "advice" JSONB,
    "quickActions" JSONB,
    "calendarInsights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrowthBrief_businessId_idx" ON "GrowthBrief"("businessId");

-- CreateIndex
CREATE INDEX "GrowthBrief_businessId_type_idx" ON "GrowthBrief"("businessId", "type");

-- CreateIndex
CREATE INDEX "GrowthBrief_date_idx" ON "GrowthBrief"("date");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthBrief_businessId_type_date_key" ON "GrowthBrief"("businessId", "type", "date");

-- AddForeignKey
ALTER TABLE "GrowthBrief" ADD CONSTRAINT "GrowthBrief_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

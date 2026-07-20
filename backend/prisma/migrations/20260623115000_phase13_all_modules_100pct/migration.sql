/*
  Warnings:

  - Added the required column `businessId` to the `AutomationRule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DealSource" AS ENUM ('WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL', 'DIRECT', 'MARKETPLACE', 'OTHER');

-- AlterEnum
ALTER TYPE "BusinessModule" ADD VALUE 'TRAINING';

-- AlterTable
-- AlterTable: first add nullable, populate existing rows, then set NOT NULL
ALTER TABLE "AutomationRule" ADD COLUMN "businessId" TEXT;
UPDATE "AutomationRule" SET "businessId" = (SELECT id FROM "Business" LIMIT 1) WHERE "businessId" IS NULL;
ALTER TABLE "AutomationRule" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'FCFA',
ADD COLUMN     "price" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "UserTraining" ADD COLUMN     "amountPaid" DECIMAL(12,2),
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRef" TEXT;

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "clientId" TEXT DEFAULT '',
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "source" "DealSource" NOT NULL DEFAULT 'OTHER',
    "probability" INTEGER NOT NULL DEFAULT 50,
    "expectedCloseDate" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[],
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineStage_businessId_idx" ON "PipelineStage"("businessId");

-- CreateIndex
CREATE INDEX "PipelineStage_businessId_order_idx" ON "PipelineStage"("businessId", "order");

-- CreateIndex
CREATE INDEX "Deal_businessId_idx" ON "Deal"("businessId");

-- CreateIndex
CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");

-- CreateIndex
CREATE INDEX "Deal_businessId_stageId_idx" ON "Deal"("businessId", "stageId");

-- CreateIndex
CREATE INDEX "Deal_businessId_deletedAt_idx" ON "Deal"("businessId", "deletedAt");

-- CreateIndex
CREATE INDEX "AutomationRule_businessId_idx" ON "AutomationRule"("businessId");

-- CreateIndex
CREATE INDEX "AutomationRule_businessId_trigger_idx" ON "AutomationRule"("businessId", "trigger");

-- CreateIndex
CREATE INDEX "AutomationRule_businessId_status_idx" ON "AutomationRule"("businessId", "status");

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

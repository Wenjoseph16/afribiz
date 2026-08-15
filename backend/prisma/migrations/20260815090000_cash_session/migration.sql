-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('OPENING', 'SALE', 'FREE_SALE', 'EXPENSE', 'DEBT_COLLECTION', 'ADJUSTMENT', 'WITHDRAWAL');

-- CreateTable
CREATE TABLE "CashSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "expectedBalance" DECIMAL(12,2),
    "actualBalance" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "closingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "performedBy" TEXT NOT NULL,
    "offlineClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashMovement_offlineClientId_key" ON "CashMovement"("offlineClientId");

-- CreateIndex
CREATE INDEX "CashSession_businessId_idx" ON "CashSession"("businessId");

-- CreateIndex
CREATE INDEX "CashSession_businessId_status_idx" ON "CashSession"("businessId", "status");

-- CreateIndex
CREATE INDEX "CashSession_openedAt_idx" ON "CashSession"("openedAt");

-- CreateIndex
CREATE INDEX "CashMovement_sessionId_idx" ON "CashMovement"("sessionId");

-- CreateIndex
CREATE INDEX "CashMovement_businessId_idx" ON "CashMovement"("businessId");

-- CreateIndex
CREATE INDEX "CashMovement_sourceType_sourceId_idx" ON "CashMovement"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "CashMovement_offlineClientId_idx" ON "CashMovement"("offlineClientId");

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

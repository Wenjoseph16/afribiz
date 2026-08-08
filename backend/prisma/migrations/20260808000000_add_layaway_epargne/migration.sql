-- CreateEnum
CREATE TYPE "LayawayStatus" AS ENUM ('ACTIVE', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "LayawayOffer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 90,
    "minInstallment" DECIMAL(12,2) NOT NULL DEFAULT 2000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "planCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LayawayOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayawayPlan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemImage" TEXT,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "savedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minInstallment" DECIMAL(12,2) NOT NULL DEFAULT 2000,
    "durationDays" INTEGER NOT NULL DEFAULT 90,
    "status" "LayawayStatus" NOT NULL DEFAULT 'ACTIVE',
    "escrowId" TEXT,
    "orderId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LayawayPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayawayContribution" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "paymentId" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LayawayContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LayawayOffer_itemType_itemId_key" ON "LayawayOffer"("itemType", "itemId");
CREATE INDEX "LayawayOffer_businessId_idx" ON "LayawayOffer"("businessId");
CREATE INDEX "LayawayPlan_clientId_idx" ON "LayawayPlan"("clientId");
CREATE INDEX "LayawayPlan_businessId_idx" ON "LayawayPlan"("businessId");
CREATE INDEX "LayawayPlan_offerId_idx" ON "LayawayPlan"("offerId");
CREATE INDEX "LayawayPlan_status_idx" ON "LayawayPlan"("status");
CREATE INDEX "LayawayContribution_planId_idx" ON "LayawayContribution"("planId");

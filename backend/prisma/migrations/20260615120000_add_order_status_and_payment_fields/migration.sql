-- AlterEnum: Add missing OrderStatus values
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUSED';

-- AlterEnum: Add missing BookingStatus values
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ARRIVED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';

-- AlterTable: Add payment and status tracking fields to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refusedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refuseReason" TEXT;

-- AlterTable: Add public page SEO and branding fields to Business
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "googleMapsLink" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "premiumUntil" TIMESTAMP(3);

-- AlterTable: Add copilot premium fields
ALTER TABLE "CopilotConfiguration" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CopilotConfiguration" ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMP(3);
ALTER TABLE "CopilotConfiguration" ADD COLUMN IF NOT EXISTS "premiumUntil" TIMESTAMP(3);

-- AlterTable: Add escrow fee fields
ALTER TABLE "Escrow" ADD COLUMN IF NOT EXISTS "fee" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Escrow" ADD COLUMN IF NOT EXISTS "feeRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Escrow" ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(12,2);
ALTER TABLE "Escrow" ADD COLUMN IF NOT EXISTS "releasedToWallet" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: Wallet
CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "locked" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_businessId_key" ON "Wallet"("businessId");
CREATE INDEX IF NOT EXISTS "Wallet_businessId_idx" ON "Wallet"("businessId");

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: WalletTransaction
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "reference" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_type_idx" ON "WalletTransaction"("type");
CREATE INDEX IF NOT EXISTS "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

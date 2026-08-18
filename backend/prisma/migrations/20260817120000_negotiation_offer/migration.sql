-- Négociation & Prix Flash Client (Brique C)
CREATE TABLE "NegotiationOffer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "proposedPrice" DECIMAL(12,2) NOT NULL,
    "message" TEXT,
    "clientName" TEXT,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "counterPrice" DECIMAL(12,2),
    "counterMessage" TEXT,
    "agreedPrice" DECIMAL(12,2),
    "token" TEXT,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NegotiationOffer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NegotiationOffer_token_key" ON "NegotiationOffer"("token");
CREATE INDEX "NegotiationOffer_businessId_status_idx" ON "NegotiationOffer"("businessId", "status");
CREATE INDEX "NegotiationOffer_businessId_createdAt_idx" ON "NegotiationOffer"("businessId", "createdAt");
CREATE INDEX "NegotiationOffer_itemType_itemId_idx" ON "NegotiationOffer"("itemType", "itemId");

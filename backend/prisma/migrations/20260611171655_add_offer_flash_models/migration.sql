-- CreateTable
CREATE TABLE "OfferFlash" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "originalPrice" DECIMAL(12,2),
    "flashPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "maxPerCustomer" INTEGER DEFAULT 1,
    "terms" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "radiusKm" INTEGER DEFAULT 5,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferFlash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferFlash_businessId_idx" ON "OfferFlash"("businessId");

-- CreateIndex
CREATE INDEX "OfferFlash_endAt_idx" ON "OfferFlash"("endAt");

-- CreateIndex
CREATE INDEX "OfferFlash_isActive_idx" ON "OfferFlash"("isActive");

-- CreateIndex
CREATE INDEX "OfferFlash_latitude_longitude_idx" ON "OfferFlash"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "OfferFlash_createdAt_idx" ON "OfferFlash"("createdAt");

-- AddForeignKey
ALTER TABLE "OfferFlash" ADD CONSTRAINT "OfferFlash_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

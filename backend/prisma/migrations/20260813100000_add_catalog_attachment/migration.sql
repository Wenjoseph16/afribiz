-- CreateTable
CREATE TABLE "CatalogAttachment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "scopeType" TEXT NOT NULL DEFAULT 'ITEM',
    "categoryId" TEXT,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogAttachment_businessId_itemType_itemId_isActive_idx" ON "CatalogAttachment"("businessId", "itemType", "itemId", "isActive");

-- CreateIndex
CREATE INDEX "CatalogAttachment_sourceType_sourceId_idx" ON "CatalogAttachment"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "CatalogAttachment_scopeType_categoryId_idx" ON "CatalogAttachment"("scopeType", "categoryId");

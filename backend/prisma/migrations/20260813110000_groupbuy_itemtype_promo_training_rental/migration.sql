-- AlterTable: GroupBuy — rattachement universel (tout type d'article)
ALTER TABLE "GroupBuy" ADD COLUMN "itemType" TEXT;
ALTER TABLE "GroupBuy" ADD COLUMN "itemId" TEXT;

-- Rétrocompat : les groupBuys existants liés à un produit deviennent PRODUCT
UPDATE "GroupBuy" SET "itemType" = 'PRODUCT', "itemId" = "productId" WHERE "productId" IS NOT NULL AND "itemType" IS NULL;
UPDATE "GroupBuy" SET "itemId" = "productId" WHERE "productId" IS NOT NULL AND "itemId" IS NULL;

-- CreateIndex
CREATE INDEX "GroupBuy_itemType_itemId_idx" ON "GroupBuy"("itemType", "itemId");

-- AlterEnum: PromotionTargetType += TRAINING, RENTAL
ALTER TYPE "PromotionTargetType" ADD VALUE IF NOT EXISTS 'TRAINING';
ALTER TYPE "PromotionTargetType" ADD VALUE IF NOT EXISTS 'RENTAL';

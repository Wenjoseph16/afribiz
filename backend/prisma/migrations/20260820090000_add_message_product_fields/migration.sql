-- AlterTable
ALTER TABLE "Message" ADD COLUMN "productId" TEXT,
    ADD COLUMN "productName" TEXT,
    ADD COLUMN "productPrice" TEXT,
    ADD COLUMN "productImage" TEXT,
    ADD COLUMN "productSlug" TEXT,
    ADD COLUMN "businessId" TEXT;

-- CreateIndex
CREATE INDEX "Message_productId_idx" ON "Message"("productId");

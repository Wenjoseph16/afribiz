-- AlterTable
ALTER TABLE "DeveloperRevenue" ADD COLUMN     "businessId" TEXT;

-- CreateIndex
CREATE INDEX "DeveloperRevenue_businessId_idx" ON "DeveloperRevenue"("businessId");

-- AddForeignKey
ALTER TABLE "DeveloperRevenue" ADD CONSTRAINT "DeveloperRevenue_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

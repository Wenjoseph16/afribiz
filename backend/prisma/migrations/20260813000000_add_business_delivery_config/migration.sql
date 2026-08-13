-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "minDeliveryAmount" DECIMAL(12,2);

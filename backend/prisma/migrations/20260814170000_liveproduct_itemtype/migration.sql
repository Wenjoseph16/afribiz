-- AlterTable: LiveProduct peut lier tout type d'article du catalogue
ALTER TABLE "LiveProduct" ADD COLUMN "itemType" TEXT NOT NULL DEFAULT 'PRODUCT';
ALTER TABLE "LiveProduct" ADD COLUMN "itemId" TEXT;

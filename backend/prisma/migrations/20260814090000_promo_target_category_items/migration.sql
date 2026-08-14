-- AlterEnum: PromotionTargetType += CATEGORY, ITEMS
-- (Socle de rattachement — le business cible une catégorie ou des articles précis)
ALTER TYPE "PromotionTargetType" ADD VALUE IF NOT EXISTS 'CATEGORY';
ALTER TYPE "PromotionTargetType" ADD VALUE IF NOT EXISTS 'ITEMS';

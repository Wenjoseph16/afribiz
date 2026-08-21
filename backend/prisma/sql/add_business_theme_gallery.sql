-- Ajout du thème de la page publique + galerie photos sur Business
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "theme" JSONB;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[];

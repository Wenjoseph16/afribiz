-- AlterTable
ALTER TABLE "DeveloperProfile" ADD COLUMN "expertise" JSONB,
ADD COLUMN "gitlab" TEXT,
ADD COLUMN "portfolioItems" JSONB,
ADD COLUMN "certifications" JSONB;

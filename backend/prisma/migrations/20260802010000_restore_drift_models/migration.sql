-- CreateEnum
CREATE TYPE "CmsPageType" AS ENUM ('PAGE', 'ARTICLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SecurityLogAction" ADD VALUE 'KYC_CHECK';
ALTER TYPE "SecurityLogAction" ADD VALUE 'AML_BLOCK';

-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'PUSH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BusinessModule" ADD VALUE 'SAVINGS';
ALTER TYPE "BusinessModule" ADD VALUE 'CRM';
ALTER TYPE "BusinessModule" ADD VALUE 'MARKETING';
ALTER TYPE "BusinessModule" ADD VALUE 'MEDIA';
ALTER TYPE "BusinessModule" ADD VALUE 'AFRISCORE';
ALTER TYPE "BusinessModule" ADD VALUE 'GROUP_BUY';
ALTER TYPE "BusinessModule" ADD VALUE 'VOICE';

-- AlterEnum
ALTER TYPE "DebtSourceType" ADD VALUE 'MANUAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdPlacementPage" ADD VALUE 'ABOUT';
ALTER TYPE "AdPlacementPage" ADD VALUE 'PRICING';
ALTER TYPE "AdPlacementPage" ADD VALUE 'CONTACT';
ALTER TYPE "AdPlacementPage" ADD VALUE 'DEVELOPERS';
ALTER TYPE "AdPlacementPage" ADD VALUE 'BLOG';
ALTER TYPE "AdPlacementPage" ADD VALUE 'MEDIA';
ALTER TYPE "AdPlacementPage" ADD VALUE 'BLOG_ARTICLE';
ALTER TYPE "AdPlacementPage" ADD VALUE 'LEGAL';

-- AlterEnum
ALTER TYPE "NotificationTemplateChannel" ADD VALUE 'PUSH';

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "response" TEXT,
ADD COLUMN     "responseAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "businessId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AdCampaign" ADD COLUMN     "slotId" TEXT,
ADD COLUMN     "targetPages" TEXT[],
ADD COLUMN     "targetPositions" TEXT[];

-- AlterTable
ALTER TABLE "CmsPage" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "type" "CmsPageType" NOT NULL DEFAULT 'PAGE';

-- CreateTable
CREATE TABLE "AdSlot" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "mobileMoney" TEXT[],
    "phoneCode" TEXT,
    "locales" TEXT[] DEFAULT ARRAY['fr']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'common',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMetadata" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodAggregation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "period" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BUSINESS',
    "layout" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BUSINESS',
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB DEFAULT '{}',
    "position" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 1,
    "height" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBlockedDate" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdSlot_page_position_isActive_idx" ON "AdSlot"("page", "position", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AdSlot_page_position_key" ON "AdSlot"("page", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Country_regionId_idx" ON "Country"("regionId");

-- CreateIndex
CREATE INDEX "Country_isActive_idx" ON "Country"("isActive");

-- CreateIndex
CREATE INDEX "City_countryId_isActive_idx" ON "City"("countryId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "City_countryId_name_key" ON "City"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationKey_key_key" ON "TranslationKey"("key");

-- CreateIndex
CREATE INDEX "TranslationKey_namespace_idx" ON "TranslationKey"("namespace");

-- CreateIndex
CREATE INDEX "Translation_locale_idx" ON "Translation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_keyId_locale_key" ON "Translation"("keyId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "UserMetadata_userId_key" ON "UserMetadata"("userId");

-- CreateIndex
CREATE INDEX "UserMetadata_userId_idx" ON "UserMetadata"("userId");

-- CreateIndex
CREATE INDEX "MetricSnapshot_businessId_metric_idx" ON "MetricSnapshot"("businessId", "metric");

-- CreateIndex
CREATE INDEX "MetricSnapshot_businessId_snapshotAt_idx" ON "MetricSnapshot"("businessId", "snapshotAt");

-- CreateIndex
CREATE INDEX "PeriodAggregation_businessId_period_date_idx" ON "PeriodAggregation"("businessId", "period", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodAggregation_businessId_period_metric_date_key" ON "PeriodAggregation"("businessId", "period", "metric", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLayout_userId_businessId_role_key" ON "DashboardLayout"("userId", "businessId", "role");

-- CreateIndex
CREATE INDEX "DashboardWidget_userId_idx" ON "DashboardWidget"("userId");

-- CreateIndex
CREATE INDEX "DashboardWidget_businessId_idx" ON "DashboardWidget"("businessId");

-- CreateIndex
CREATE INDEX "DashboardWidget_role_idx" ON "DashboardWidget"("role");

-- CreateIndex
CREATE INDEX "RoomBlockedDate_roomId_idx" ON "RoomBlockedDate"("roomId");

-- CreateIndex
CREATE INDEX "RoomBlockedDate_startDate_endDate_idx" ON "RoomBlockedDate"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AdCampaign_slotId_idx" ON "AdCampaign"("slotId");

-- CreateIndex
CREATE INDEX "CmsPage_type_idx" ON "CmsPage"("type");

-- CreateIndex
CREATE INDEX "CmsPage_type_status_idx" ON "CmsPage"("type", "status");

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AdSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Country" ADD CONSTRAINT "Country_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "TranslationKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMetadata" ADD CONSTRAINT "UserMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBlockedDate" ADD CONSTRAINT "RoomBlockedDate_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;


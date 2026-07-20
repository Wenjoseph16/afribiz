-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('PRODUCT_GAP', 'SERVICE_GAP', 'TRENDING_SEARCH', 'FAVORITE_GAP', 'LOCAL_TREND');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'SEEN', 'ACTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "businessId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'marketplace',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "keyword" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SEARCH',
    "count" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "seenAt" TIMESTAMP(3),
    "actedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketNeed" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "budget" DECIMAL(12,2),
    "urgency" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketIdea" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchLog_query_idx" ON "SearchLog"("query");

-- CreateIndex
CREATE INDEX "SearchLog_resultCount_idx" ON "SearchLog"("resultCount");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_resultCount_idx" ON "SearchLog"("createdAt", "resultCount");

-- CreateIndex
CREATE INDEX "Opportunity_businessId_status_idx" ON "Opportunity"("businessId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_businessId_type_idx" ON "Opportunity"("businessId", "type");

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

-- CreateIndex
CREATE INDEX "MarketNeed_businessId_idx" ON "MarketNeed"("businessId");

-- CreateIndex
CREATE INDEX "MarketNeed_category_idx" ON "MarketNeed"("category");

-- CreateIndex
CREATE INDEX "MarketNeed_status_idx" ON "MarketNeed"("status");

-- CreateIndex
CREATE INDEX "MarketNeed_votes_idx" ON "MarketNeed"("votes");

-- CreateIndex
CREATE INDEX "MarketIdea_businessId_idx" ON "MarketIdea"("businessId");

-- CreateIndex
CREATE INDEX "MarketIdea_category_idx" ON "MarketIdea"("category");

-- CreateIndex
CREATE INDEX "MarketIdea_votes_idx" ON "MarketIdea"("votes");

-- CreateIndex
CREATE INDEX "MarketVote_targetType_targetId_idx" ON "MarketVote"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketVote_userId_targetType_targetId_key" ON "MarketVote"("userId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketNeed" ADD CONSTRAINT "MarketNeed_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIdea" ADD CONSTRAINT "MarketIdea_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketVote" ADD CONSTRAINT "MarketVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ModuleDemandStatus" AS ENUM ('OPEN', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "AutomationTrigger" NOT NULL,
    "triggerConfig" JSONB DEFAULT '{}',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignStep" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "delayMinutes" INTEGER,
    "delayHours" INTEGER,
    "delayDays" INTEGER,
    "actionType" "AutomationActionType" NOT NULL,
    "actionConfig" JSONB NOT NULL,
    "conditions" JSONB DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignExecutionLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "stepId" TEXT,
    "userId" TEXT,
    "businessId" TEXT,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,
    "metadata" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleDemand" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "moduleType" "BusinessModule" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "deadline" TIMESTAMP(3),
    "status" "ModuleDemandStatus" NOT NULL DEFAULT 'OPEN',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleMatch" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "developerId" TEXT,
    "moduleId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "matchReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "contactedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandSearchLog" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_businessId_idx" ON "Campaign"("businessId");

-- CreateIndex
CREATE INDEX "Campaign_trigger_idx" ON "Campaign"("trigger");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_isTemplate_idx" ON "Campaign"("isTemplate");

-- CreateIndex
CREATE INDEX "CampaignStep_campaignId_idx" ON "CampaignStep"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignStep_stepOrder_idx" ON "CampaignStep"("stepOrder");

-- CreateIndex
CREATE INDEX "CampaignExecutionLog_campaignId_idx" ON "CampaignExecutionLog"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignExecutionLog_executedAt_idx" ON "CampaignExecutionLog"("executedAt");

-- CreateIndex
CREATE INDEX "ModuleDemand_businessId_idx" ON "ModuleDemand"("businessId");

-- CreateIndex
CREATE INDEX "ModuleDemand_moduleType_idx" ON "ModuleDemand"("moduleType");

-- CreateIndex
CREATE INDEX "ModuleDemand_status_idx" ON "ModuleDemand"("status");

-- CreateIndex
CREATE INDEX "ModuleMatch_demandId_idx" ON "ModuleMatch"("demandId");

-- CreateIndex
CREATE INDEX "ModuleMatch_developerId_idx" ON "ModuleMatch"("developerId");

-- CreateIndex
CREATE INDEX "ModuleMatch_moduleId_idx" ON "ModuleMatch"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleMatch_score_idx" ON "ModuleMatch"("score");

-- CreateIndex
CREATE INDEX "ModuleMatch_status_idx" ON "ModuleMatch"("status");

-- CreateIndex
CREATE INDEX "DemandSearchLog_demandId_idx" ON "DemandSearchLog"("demandId");

-- CreateIndex
CREATE INDEX "DemandSearchLog_createdAt_idx" ON "DemandSearchLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignExecutionLog" ADD CONSTRAINT "CampaignExecutionLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleMatch" ADD CONSTRAINT "ModuleMatch_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "ModuleDemand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

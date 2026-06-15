-- CreateEnum
CREATE TYPE "FeatureFlagScope" AS ENUM ('GLOBAL', 'BUSINESS_TYPE', 'BUSINESS', 'USER_ROLE', 'PLAN_TYPE');

-- CreateEnum
CREATE TYPE "AdminPermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'BAN', 'EXPORT', 'CONFIGURE');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('STOCK_LOW', 'STOCK_OUT', 'STOCK_BACK_IN', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'BOOKING_MADE', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER', 'REVIEW_PUBLISHED', 'NEW_CLIENT', 'CLIENT_INACTIVE', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED', 'MODULE_INSTALLED', 'MODULE_UNINSTALLED', 'SCORE_CHANGED', 'BADGE_EARNED', 'DEBT_OVERDUE', 'DISPUTE_OPENED', 'AD_COMPLETED', 'EVENT_SCHEDULED', 'CUSTOM_WEBHOOK');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SEND_NOTIFICATION', 'SEND_EMAIL', 'SEND_SMS', 'SEND_WHATSAPP', 'UPDATE_STATUS', 'APPLY_DISCOUNT', 'ASSIGN_TAG', 'CREATE_TASK', 'UPDATE_SCORE', 'BLOCK_USER', 'SUSPEND_BUSINESS', 'CALL_WEBHOOK', 'LOG_EVENT');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CmsPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationTemplateChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "MediaContentType" AS ENUM ('STORY', 'SHORT', 'LIVE', 'OFFER_FLASH', 'AD_CREATIVE', 'PRODUCT_IMAGE', 'SERVICE_IMAGE', 'PORTFOLIO_MEDIA', 'BUSINESS_PHOTO', 'REVIEW_IMAGE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'WHATSAPP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'WELCOME';
ALTER TYPE "NotificationType" ADD VALUE 'MODULE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'MODULE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'AD_VALIDATED';
ALTER TYPE "NotificationType" ADD VALUE 'AD_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'AD_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'VERIFICATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'VERIFICATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_PROCESSED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_RENEWED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_FEATURE_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE 'MAINTENANCE_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'PLATFORM_ANNOUNCEMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_LOGIN';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_ACTION';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_SETTINGS_CHANGE';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_FEATURE_FLAG_CHANGE';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_ROLE_CHANGE';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_USER_ACTION';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_BUSINESS_ACTION';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_MODULE_ACTION';
ALTER TYPE "SecurityLogAction" ADD VALUE 'ADMIN_CONTENT_MODERATION';
ALTER TYPE "SecurityLogAction" ADD VALUE 'SETTINGS_CHANGED';
ALTER TYPE "SecurityLogAction" ADD VALUE 'FEATURE_FLAG_CHANGED';
ALTER TYPE "SecurityLogAction" ADD VALUE 'AUTOMATION_RULE_CHANGED';
ALTER TYPE "SecurityLogAction" ADD VALUE 'CMS_PAGE_CHANGED';
ALTER TYPE "SecurityLogAction" ADD VALUE 'FORM_TEMPLATE_CHANGED';

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" "FeatureFlagScope" NOT NULL DEFAULT 'GLOBAL',
    "scopeValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" "AdminPermissionAction" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "AdminRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "AutomationTrigger" NOT NULL,
    "triggerConfig" JSONB DEFAULT '{}',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "actionType" "AutomationActionType" NOT NULL,
    "actionConfig" JSONB NOT NULL,
    "cooldownMinutes" INTEGER DEFAULT 0,
    "status" "AutomationStatus" NOT NULL DEFAULT 'ACTIVE',
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecutionLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL,
    "triggerData" JSONB,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CmsPageStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "schema" JSONB NOT NULL,
    "uiSchema" JSONB NOT NULL DEFAULT '{}',
    "status" "FormTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationTemplateChannel" NOT NULL,
    "subject" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotConfiguration" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "healthThresholds" JSONB NOT NULL DEFAULT '{"excellent":80,"good":60,"fair":40,"critical":0}',
    "tipCategories" TEXT[] DEFAULT ARRAY['profile', 'score', 'reliability', 'activity', 'products', 'reviews', 'growth', 'success']::TEXT[],
    "dailyTipEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertRules" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopilotConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCopilotConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultTipCategories" TEXT[] DEFAULT ARRAY['profile', 'score', 'reliability', 'activity', 'products', 'reviews', 'growth', 'success']::TEXT[],
    "globalAlertRules" JSONB NOT NULL DEFAULT '[]',
    "scoreWeight" JSONB NOT NULL DEFAULT '{"afriScore":40,"orders30d":15,"bookings30d":15,"reviews30d":10,"pageViews30d":10,"products":5,"ads":5}',
    "healthLabels" JSONB NOT NULL DEFAULT '{"excellent":{"min":80,"label":"Excellent","color":"green"},"good":{"min":60,"label":"Bon","color":"blue"},"fair":{"min":40,"label":"Moyen","color":"yellow"},"critical":{"min":0,"label":"Critique","color":"red"}}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCopilotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaModerationItem" (
    "id" TEXT NOT NULL,
    "contentType" "MediaContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "reportedById" TEXT,
    "reason" TEXT,
    "description" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaModerationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeValue" TEXT,
    "minFee" DECIMAL(12,2),
    "maxFee" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "PlatformSetting_category_idx" ON "PlatformSetting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "FeatureFlag_scope_idx" ON "FeatureFlag"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");

-- CreateIndex
CREATE INDEX "AdminPermission_resource_idx" ON "AdminPermission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_resource_action_key" ON "AdminPermission"("resource", "action");

-- CreateIndex
CREATE INDEX "AdminRoleAssignment_userId_idx" ON "AdminRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "AdminRoleAssignment_roleId_idx" ON "AdminRoleAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRoleAssignment_userId_roleId_key" ON "AdminRoleAssignment"("userId", "roleId");

-- CreateIndex
CREATE INDEX "AutomationRule_trigger_idx" ON "AutomationRule"("trigger");

-- CreateIndex
CREATE INDEX "AutomationRule_status_idx" ON "AutomationRule"("status");

-- CreateIndex
CREATE INDEX "AutomationRule_trigger_status_idx" ON "AutomationRule"("trigger", "status");

-- CreateIndex
CREATE INDEX "AutomationExecutionLog_ruleId_idx" ON "AutomationExecutionLog"("ruleId");

-- CreateIndex
CREATE INDEX "AutomationExecutionLog_executedAt_idx" ON "AutomationExecutionLog"("executedAt");

-- CreateIndex
CREATE INDEX "AutomationExecutionLog_result_idx" ON "AutomationExecutionLog"("result");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "CmsPage_slug_idx" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "CmsPage_category_idx" ON "CmsPage"("category");

-- CreateIndex
CREATE INDEX "CmsPage_status_idx" ON "CmsPage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CmsCategory_slug_key" ON "CmsCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_slug_key" ON "FormTemplate"("slug");

-- CreateIndex
CREATE INDEX "FormTemplate_slug_idx" ON "FormTemplate"("slug");

-- CreateIndex
CREATE INDEX "FormTemplate_category_idx" ON "FormTemplate"("category");

-- CreateIndex
CREATE INDEX "FormTemplate_status_idx" ON "FormTemplate"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_templateId_idx" ON "FormSubmission"("templateId");

-- CreateIndex
CREATE INDEX "FormSubmission_userId_idx" ON "FormSubmission"("userId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_type_idx" ON "NotificationTemplate"("type");

-- CreateIndex
CREATE INDEX "NotificationTemplate_channel_idx" ON "NotificationTemplate"("channel");

-- CreateIndex
CREATE INDEX "NotificationTemplate_isActive_idx" ON "NotificationTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_type_channel_key" ON "NotificationTemplate"("type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "CopilotConfiguration_businessId_key" ON "CopilotConfiguration"("businessId");

-- CreateIndex
CREATE INDEX "MediaModerationItem_contentType_idx" ON "MediaModerationItem"("contentType");

-- CreateIndex
CREATE INDEX "MediaModerationItem_status_idx" ON "MediaModerationItem"("status");

-- CreateIndex
CREATE INDEX "MediaModerationItem_contentType_status_idx" ON "MediaModerationItem"("contentType", "status");

-- CreateIndex
CREATE INDEX "MediaModerationItem_reportedById_idx" ON "MediaModerationItem"("reportedById");

-- CreateIndex
CREATE INDEX "MediaModerationItem_reviewedById_idx" ON "MediaModerationItem"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionConfig_key_key" ON "CommissionConfig"("key");

-- CreateIndex
CREATE INDEX "CommissionConfig_key_idx" ON "CommissionConfig"("key");

-- CreateIndex
CREATE INDEX "CommissionConfig_scope_idx" ON "CommissionConfig"("scope");

-- CreateIndex
CREATE INDEX "CommissionConfig_isActive_idx" ON "CommissionConfig"("isActive");

-- CreateIndex
CREATE INDEX "UserWarning_userId_idx" ON "UserWarning"("userId");

-- CreateIndex
CREATE INDEX "UserWarning_issuedById_idx" ON "UserWarning"("issuedById");

-- AddForeignKey
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AdminPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRoleAssignment" ADD CONSTRAINT "AdminRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRoleAssignment" ADD CONSTRAINT "AdminRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsPage" ADD CONSTRAINT "CmsPage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotConfiguration" ADD CONSTRAINT "CopilotConfiguration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaModerationItem" ADD CONSTRAINT "MediaModerationItem_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaModerationItem" ADD CONSTRAINT "MediaModerationItem_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWarning" ADD CONSTRAINT "UserWarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWarning" ADD CONSTRAINT "UserWarning_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

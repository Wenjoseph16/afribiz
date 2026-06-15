/*
  Warnings:

  - Added the required column `updatedAt` to the `UserTraining` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PAGE_VIEW', 'PRODUCT_VIEW', 'PRODUCT_CLICK', 'ORDER_PLACED', 'ORDER_COMPLETED', 'BOOKING_MADE', 'BOOKING_CANCELLED', 'REVIEW_WRITTEN', 'NOTE_ADDED', 'TAG_ASSIGNED', 'SEGMENT_CHANGED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'PROMOTION_CLICKED');

-- CreateEnum
CREATE TYPE "ModulePermissionAccess" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModulePermissionResource" AS ENUM ('PRODUCTS', 'SERVICES', 'BOOKINGS', 'ORDERS', 'CLIENTS', 'CRM', 'MARKETING', 'PAYMENTS', 'ACCOUNTING', 'EMPLOYEES', 'DELIVERIES', 'EVENTS', 'TRAININGS', 'RENTALS', 'SETTINGS', 'DATA_EXPORT');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('MODULE_SUBMITTED', 'MODULE_APPROVED', 'MODULE_REJECTED', 'MODULE_INSTALLED', 'MODULE_UNINSTALLED', 'MODULE_SOLD', 'MODULE_REVIEWED', 'MODULE_UPDATED', 'MODULE_LICENSE_EXPIRING', 'MODULE_LICENSE_EXPIRED', 'MODULE_ERROR', 'PAYOUT_REQUESTED', 'PAYOUT_COMPLETED', 'TICKET_CREATED', 'TICKET_RESOLVED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "ModuleSubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "ModuleActivityType" AS ENUM ('INSTALLED', 'UNINSTALLED', 'ACTIVATED', 'DEACTIVATED', 'CONFIGURED', 'ERROR', 'UPDATED', 'REPORTED', 'REVIEWED', 'TRIAL_STARTED', 'SUBSCRIPTION_STARTED', 'SUBSCRIPTION_ENDED', 'LICENSE_ACTIVATED', 'LICENSE_EXPIRED');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('VERIFICATION', 'ACHIEVEMENT', 'MILESTONE', 'QUALITY', 'COMMUNITY');

-- AlterEnum
ALTER TYPE "AdStatus" ADD VALUE 'PAUSED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'VERIFYING';
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SecurityLogAction" ADD VALUE 'TWOFA_CHALLENGE';
ALTER TYPE "SecurityLogAction" ADD VALUE 'FAILED_2FA';
ALTER TYPE "SecurityLogAction" ADD VALUE 'TWOFA_VERIFIED';
ALTER TYPE "SecurityLogAction" ADD VALUE 'TOKEN_REUSE';

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_refereeId_fkey";

-- DropIndex
DROP INDEX "Payment_invoiceId_key";

-- DropIndex
DROP INDEX "Payment_orderId_key";

-- DropIndex
DROP INDEX "Payment_quoteId_key";

-- DropIndex
DROP INDEX "Referral_refereeId_key";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "rentalId" TEXT;

-- AlterTable
ALTER TABLE "BusinessDocument" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DeveloperProfile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "refereeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "images" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "UserTraining" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "BusinessNotificationTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "customTitle" TEXT NOT NULL,
    "customDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessNotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'AUTRE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "attachments" JSONB,
    "taxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessClient" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessTag" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessClientTag" (
    "clientId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessClientTag_pkey" PRIMARY KEY ("clientId","tagId")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "businessClientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSegment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "conditions" JSONB,
    "isDynamic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentClient" (
    "segmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentClient_pkey" PRIMARY KEY ("segmentId","clientId")
);

-- CreateTable
CREATE TABLE "ClientActivityLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPageView" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "duration" INTEGER DEFAULT 0,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessPageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductView" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "source" TEXT DEFAULT 'direct',
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductClick" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "source" TEXT DEFAULT 'marketplace',
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLesson" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "videoUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "timeLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signatureData" TEXT,
    "ipAddress" TEXT,
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulePermission" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "resource" "ModulePermissionResource" NOT NULL,
    "accessLevel" "ModulePermissionAccess" NOT NULL DEFAULT 'READ',
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleConfiguration" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleActivityLog" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "businessId" TEXT,
    "installationId" TEXT,
    "activityType" "ModuleActivityType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleManifest" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "versionId" TEXT,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
    "minAppVersion" TEXT,
    "maxAppVersion" TEXT,
    "dependencies" JSONB,
    "permissions" JSONB,
    "hooks" TEXT[],
    "provides" TEXT[],
    "requires" TEXT[],
    "conflicts" TEXT[],
    "changelog" TEXT,
    "readme" TEXT,
    "icon" TEXT,
    "screenshots" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperBadge" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" "BadgeCategory" NOT NULL DEFAULT 'ACHIEVEMENT',
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleCommission" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessNotificationTemplate_businessId_idx" ON "BusinessNotificationTemplate"("businessId");

-- CreateIndex
CREATE INDEX "BusinessNotificationTemplate_businessId_isActive_idx" ON "BusinessNotificationTemplate"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessNotificationTemplate_businessId_type_key" ON "BusinessNotificationTemplate"("businessId", "type");

-- CreateIndex
CREATE INDEX "PaymentTransaction_businessId_idx" ON "PaymentTransaction"("businessId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_idx" ON "PaymentTransaction"("provider");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paidAt_idx" ON "PaymentTransaction"("paidAt");

-- CreateIndex
CREATE INDEX "Expense_businessId_idx" ON "Expense"("businessId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "BusinessClient_businessId_idx" ON "BusinessClient"("businessId");

-- CreateIndex
CREATE INDEX "BusinessClient_clientId_idx" ON "BusinessClient"("clientId");

-- CreateIndex
CREATE INDEX "BusinessClient_email_idx" ON "BusinessClient"("email");

-- CreateIndex
CREATE INDEX "BusinessClient_phone_idx" ON "BusinessClient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessClient_businessId_clientId_key" ON "BusinessClient"("businessId", "clientId");

-- CreateIndex
CREATE INDEX "BusinessTag_businessId_idx" ON "BusinessTag"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessTag_businessId_name_key" ON "BusinessTag"("businessId", "name");

-- CreateIndex
CREATE INDEX "BusinessClientTag_clientId_idx" ON "BusinessClientTag"("clientId");

-- CreateIndex
CREATE INDEX "BusinessClientTag_tagId_idx" ON "BusinessClientTag"("tagId");

-- CreateIndex
CREATE INDEX "ClientNote_businessClientId_idx" ON "ClientNote"("businessClientId");

-- CreateIndex
CREATE INDEX "ClientSegment_businessId_idx" ON "ClientSegment"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSegment_businessId_name_key" ON "ClientSegment"("businessId", "name");

-- CreateIndex
CREATE INDEX "SegmentClient_segmentId_idx" ON "SegmentClient"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentClient_clientId_idx" ON "SegmentClient"("clientId");

-- CreateIndex
CREATE INDEX "ClientActivityLog_businessId_clientId_idx" ON "ClientActivityLog"("businessId", "clientId");

-- CreateIndex
CREATE INDEX "ClientActivityLog_businessId_type_idx" ON "ClientActivityLog"("businessId", "type");

-- CreateIndex
CREATE INDEX "ClientActivityLog_businessId_createdAt_idx" ON "ClientActivityLog"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientActivityLog_clientId_createdAt_idx" ON "ClientActivityLog"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessPageView_businessId_viewedAt_idx" ON "BusinessPageView"("businessId", "viewedAt");

-- CreateIndex
CREATE INDEX "BusinessPageView_businessId_userId_idx" ON "BusinessPageView"("businessId", "userId");

-- CreateIndex
CREATE INDEX "BusinessPageView_visitorId_idx" ON "BusinessPageView"("visitorId");

-- CreateIndex
CREATE INDEX "ProductView_businessId_productId_idx" ON "ProductView"("businessId", "productId");

-- CreateIndex
CREATE INDEX "ProductView_businessId_viewedAt_idx" ON "ProductView"("businessId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProductView_productId_viewedAt_idx" ON "ProductView"("productId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProductClick_businessId_productId_idx" ON "ProductClick"("businessId", "productId");

-- CreateIndex
CREATE INDEX "ProductClick_businessId_clickedAt_idx" ON "ProductClick"("businessId", "clickedAt");

-- CreateIndex
CREATE INDEX "ProductClick_productId_clickedAt_idx" ON "ProductClick"("productId", "clickedAt");

-- CreateIndex
CREATE INDEX "TrainingLesson_trainingId_idx" ON "TrainingLesson"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingLesson_sortOrder_idx" ON "TrainingLesson"("sortOrder");

-- CreateIndex
CREATE INDEX "TrainingQuiz_lessonId_idx" ON "TrainingQuiz"("lessonId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_userId_idx" ON "UserQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_quizId_idx" ON "UserQuizAttempt"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_token_key" ON "DocumentSignature"("token");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentId_idx" ON "DocumentSignature"("documentId");

-- CreateIndex
CREATE INDEX "DocumentSignature_token_idx" ON "DocumentSignature"("token");

-- CreateIndex
CREATE INDEX "DocumentSignature_status_idx" ON "DocumentSignature"("status");

-- CreateIndex
CREATE INDEX "ModulePermission_moduleId_idx" ON "ModulePermission"("moduleId");

-- CreateIndex
CREATE INDEX "ModulePermission_resource_idx" ON "ModulePermission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermission_moduleId_resource_accessLevel_key" ON "ModulePermission"("moduleId", "resource", "accessLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleConfiguration_installationId_key" ON "ModuleConfiguration"("installationId");

-- CreateIndex
CREATE INDEX "ModuleConfiguration_moduleId_idx" ON "ModuleConfiguration"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleConfiguration_businessId_idx" ON "ModuleConfiguration"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleConfiguration_moduleId_businessId_key" ON "ModuleConfiguration"("moduleId", "businessId");

-- CreateIndex
CREATE INDEX "ModuleActivityLog_moduleId_idx" ON "ModuleActivityLog"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleActivityLog_businessId_idx" ON "ModuleActivityLog"("businessId");

-- CreateIndex
CREATE INDEX "ModuleActivityLog_activityType_idx" ON "ModuleActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "ModuleActivityLog_createdAt_idx" ON "ModuleActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleManifest_moduleId_key" ON "ModuleManifest"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleManifest_moduleId_idx" ON "ModuleManifest"("moduleId");

-- CreateIndex
CREATE INDEX "DeveloperBadge_developerId_idx" ON "DeveloperBadge"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperBadge_category_idx" ON "DeveloperBadge"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleCommission_transactionId_key" ON "ModuleCommission"("transactionId");

-- CreateIndex
CREATE INDEX "ModuleCommission_moduleId_idx" ON "ModuleCommission"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleCommission_transactionId_idx" ON "ModuleCommission"("transactionId");

-- CreateIndex
CREATE INDEX "ModuleCommission_status_idx" ON "ModuleCommission"("status");

-- AddForeignKey
ALTER TABLE "BusinessNotificationTemplate" ADD CONSTRAINT "BusinessNotificationTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClient" ADD CONSTRAINT "BusinessClient_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClient" ADD CONSTRAINT "BusinessClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessTag" ADD CONSTRAINT "BusinessTag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClientTag" ADD CONSTRAINT "BusinessClientTag_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClientTag" ADD CONSTRAINT "BusinessClientTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BusinessTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_businessClientId_fkey" FOREIGN KEY ("businessClientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSegment" ADD CONSTRAINT "ClientSegment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentClient" ADD CONSTRAINT "SegmentClient_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "ClientSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentClient" ADD CONSTRAINT "SegmentClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLesson" ADD CONSTRAINT "TrainingLesson_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuiz" ADD CONSTRAINT "TrainingQuiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TrainingLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BusinessDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermission" ADD CONSTRAINT "ModulePermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DeveloperModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleConfiguration" ADD CONSTRAINT "ModuleConfiguration_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DeveloperModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleConfiguration" ADD CONSTRAINT "ModuleConfiguration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleConfiguration" ADD CONSTRAINT "ModuleConfiguration_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "DeveloperModuleInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleActivityLog" ADD CONSTRAINT "ModuleActivityLog_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DeveloperModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleActivityLog" ADD CONSTRAINT "ModuleActivityLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleActivityLog" ADD CONSTRAINT "ModuleActivityLog_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "DeveloperModuleInstallation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleManifest" ADD CONSTRAINT "ModuleManifest_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DeveloperModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleManifest" ADD CONSTRAINT "ModuleManifest_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DeveloperModuleVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperBadge" ADD CONSTRAINT "DeveloperBadge_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCommission" ADD CONSTRAINT "ModuleCommission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DeveloperModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCommission" ADD CONSTRAINT "ModuleCommission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "DeveloperRevenue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

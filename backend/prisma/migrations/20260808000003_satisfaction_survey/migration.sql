-- AlterTable
ALTER TABLE "Order" ADD COLUMN "satisfactionSurveySentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SatisfactionSurveyResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "orderId" TEXT,
    "bookingId" TEXT,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatisfactionSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SatisfactionSurveyResponse_businessId_idx" ON "SatisfactionSurveyResponse"("businessId");

-- CreateIndex
CREATE INDEX "SatisfactionSurveyResponse_userId_idx" ON "SatisfactionSurveyResponse"("userId");

-- CreateIndex
CREATE INDEX "SatisfactionSurveyResponse_orderId_idx" ON "SatisfactionSurveyResponse"("orderId");

-- CreateIndex
CREATE INDEX "SatisfactionSurveyResponse_score_idx" ON "SatisfactionSurveyResponse"("score");

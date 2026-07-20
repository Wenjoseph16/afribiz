-- CreateTable
CREATE TABLE "DeadLetterEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "error" TEXT NOT NULL,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeadLetterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronLock" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CronLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "userId" TEXT,
    "visitorId" TEXT,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "source" TEXT DEFAULT 'direct',
    "ip" TEXT,
    "userAgent" TEXT,
    "durationMs" INTEGER,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDailyStats" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "orderRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "bookingRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "productsSold" INTEGER NOT NULL DEFAULT 0,
    "newClients" INTEGER NOT NULL DEFAULT 0,
    "reviewsReceived" INTEGER NOT NULL DEFAULT 0,
    "reviewsAverage" DOUBLE PRECISION,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "promotionsViewed" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDailyStats" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDailyStats" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "ordersPlaced" INTEGER NOT NULL DEFAULT 0,
    "bookingsMade" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "reviewsWritten" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeadLetterEvent_status_idx" ON "DeadLetterEvent"("status");

-- CreateIndex
CREATE INDEX "DeadLetterEvent_eventType_idx" ON "DeadLetterEvent"("eventType");

-- CreateIndex
CREATE INDEX "DeadLetterEvent_nextRetryAt_idx" ON "DeadLetterEvent"("nextRetryAt");

-- CreateIndex
CREATE INDEX "DeadLetterEvent_createdAt_idx" ON "DeadLetterEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CronLock_jobName_key" ON "CronLock"("jobName");

-- CreateIndex
CREATE INDEX "CronLock_status_idx" ON "CronLock"("status");

-- CreateIndex
CREATE INDEX "CronLock_lockedAt_idx" ON "CronLock"("lockedAt");

-- CreateIndex
CREATE INDEX "PageView_businessId_viewedAt_idx" ON "PageView"("businessId", "viewedAt");

-- CreateIndex
CREATE INDEX "PageView_url_viewedAt_idx" ON "PageView"("url", "viewedAt");

-- CreateIndex
CREATE INDEX "PageView_viewedAt_idx" ON "PageView"("viewedAt");

-- CreateIndex
CREATE INDEX "PageView_visitorId_idx" ON "PageView"("visitorId");

-- CreateIndex
CREATE INDEX "BusinessDailyStats_businessId_date_idx" ON "BusinessDailyStats"("businessId", "date");

-- CreateIndex
CREATE INDEX "BusinessDailyStats_date_idx" ON "BusinessDailyStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDailyStats_businessId_date_key" ON "BusinessDailyStats"("businessId", "date");

-- CreateIndex
CREATE INDEX "ProductDailyStats_businessId_date_idx" ON "ProductDailyStats"("businessId", "date");

-- CreateIndex
CREATE INDEX "ProductDailyStats_productId_date_idx" ON "ProductDailyStats"("productId", "date");

-- CreateIndex
CREATE INDEX "ProductDailyStats_date_idx" ON "ProductDailyStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDailyStats_productId_date_key" ON "ProductDailyStats"("productId", "date");

-- CreateIndex
CREATE INDEX "ClientDailyStats_businessId_date_idx" ON "ClientDailyStats"("businessId", "date");

-- CreateIndex
CREATE INDEX "ClientDailyStats_clientId_date_idx" ON "ClientDailyStats"("clientId", "date");

-- CreateIndex
CREATE INDEX "ClientDailyStats_businessId_clientId_idx" ON "ClientDailyStats"("businessId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDailyStats_businessId_clientId_date_key" ON "ClientDailyStats"("businessId", "clientId", "date");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_resource_resourceId_idx" ON "AdminAuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDailyStats" ADD CONSTRAINT "BusinessDailyStats_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDailyStats" ADD CONSTRAINT "ProductDailyStats_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDailyStats" ADD CONSTRAINT "ClientDailyStats_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

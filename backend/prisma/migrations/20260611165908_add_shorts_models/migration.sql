-- CreateTable
CREATE TABLE "Short" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER DEFAULT 0,
    "linkTargetType" TEXT,
    "linkTargetId" TEXT,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Short_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLike" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortComment" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL DEFAULT 'Anonyme',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortView" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Short_businessId_idx" ON "Short"("businessId");

-- CreateIndex
CREATE INDEX "Short_createdAt_idx" ON "Short"("createdAt");

-- CreateIndex
CREATE INDEX "Short_isActive_idx" ON "Short"("isActive");

-- CreateIndex
CREATE INDEX "ShortLike_shortId_idx" ON "ShortLike"("shortId");

-- CreateIndex
CREATE INDEX "ShortLike_userId_idx" ON "ShortLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortLike_shortId_userId_key" ON "ShortLike"("shortId", "userId");

-- CreateIndex
CREATE INDEX "ShortComment_shortId_idx" ON "ShortComment"("shortId");

-- CreateIndex
CREATE INDEX "ShortComment_createdAt_idx" ON "ShortComment"("createdAt");

-- CreateIndex
CREATE INDEX "ShortView_shortId_idx" ON "ShortView"("shortId");

-- CreateIndex
CREATE INDEX "ShortView_userId_idx" ON "ShortView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortView_shortId_userId_key" ON "ShortView"("shortId", "userId");

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLike" ADD CONSTRAINT "ShortLike_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortComment" ADD CONSTRAINT "ShortComment_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortView" ADD CONSTRAINT "ShortView_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "DeveloperProfile" ADD COLUMN     "companyDocument" TEXT,
ADD COLUMN     "identityDocument" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "responsiblePhoto" TEXT,
ADD COLUMN     "specialties" TEXT[],
ADD COLUMN     "technologies" TEXT[],
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ShortSave" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShortSave_shortId_idx" ON "ShortSave"("shortId");

-- CreateIndex
CREATE INDEX "ShortSave_userId_idx" ON "ShortSave"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortSave_shortId_userId_key" ON "ShortSave"("shortId", "userId");

-- AddForeignKey
ALTER TABLE "ShortSave" ADD CONSTRAINT "ShortSave_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

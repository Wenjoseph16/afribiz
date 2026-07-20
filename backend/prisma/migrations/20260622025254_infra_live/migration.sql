-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "isHighlight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stickers" JSONB DEFAULT '[]';

-- CreateIndex
CREATE INDEX "Story_isHighlight_idx" ON "Story"("isHighlight");

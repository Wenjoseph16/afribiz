-- AlterTable
ALTER TABLE "LayawayPlan" ADD COLUMN "reminder3dSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LayawayPlan" ADD COLUMN "reminder3dAt" TIMESTAMP(3);

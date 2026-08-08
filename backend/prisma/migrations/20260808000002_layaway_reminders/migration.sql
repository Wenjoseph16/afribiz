-- AlterTable
ALTER TABLE "LayawayPlan" ADD COLUMN "reminder7dSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LayawayPlan" ADD COLUMN "reminder1dSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LayawayPlan" ADD COLUMN "reminder7dAt" TIMESTAMP(3);
ALTER TABLE "LayawayPlan" ADD COLUMN "reminder1dAt" TIMESTAMP(3);

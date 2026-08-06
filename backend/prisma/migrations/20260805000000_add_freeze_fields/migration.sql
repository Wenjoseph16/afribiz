-- AlterTable User: freeze temporaire (observation)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "frozenUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "freezeReason" TEXT;

-- AlterTable Business: freeze temporaire (observation)
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "frozenUntil" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "freezeReason" TEXT;

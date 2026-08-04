-- AlterEnum
-- Two new 2FA security audit actions
ALTER TYPE "SecurityLogAction" ADD VALUE IF NOT EXISTS 'TWOFA_CODES_REGENERATED';
ALTER TYPE "SecurityLogAction" ADD VALUE IF NOT EXISTS 'TWOFA_DISABLED';

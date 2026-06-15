import { z } from 'zod';

const userActions = ['suspend', 'activate', 'block', 'delete'] as const;
const businessActions = ['validate', 'verify', 'suspend', 'block', 'delete'] as const;
const developerActions = ['validate', 'verify', 'suspend', 'block', 'delete'] as const;
const moduleActions = ['validate', 'reject', 'publish', 'archive', 'delete'] as const;
const backupActions = ['manual', 'auto'] as const;
const escrowDecisions = ['release', 'refund'] as const;
const disputeActions = ['decide', 'close'] as const;
const marketplaceItemActions = ['feature', 'unfeature'] as const;

export const updateUserStatusSchema = z.object({
  action: z.enum(userActions),
});

export const updateBusinessStatusSchema = z.object({
  action: z.enum(businessActions),
});

export const updateBusinessVerificationSchema = z.object({
  action: z.enum(['verify', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export const updateDeveloperStatusSchema = z.object({
  action: z.enum(developerActions),
});

export const updateModuleStatusSchema = z.object({
  action: z.enum(moduleActions),
});

export const createBackupSchema = z.object({
  action: z.enum(backupActions).optional().default('manual'),
});

export const restoreBackupSchema = z.object({
  backupId: z.string().min(1, 'ID de sauvegarde requis'),
});

export const arbitrateEscrowSchema = z.object({
  decision: z.enum(escrowDecisions),
});

export const blockIpSchema = z.object({
  ip: z.string().min(1, 'IP requise').max(45),
});

export const rejectAdCampaignSchema = z.object({
  reason: z.string().min(1, 'Motif requis').max(500),
});

export const suspendAdCampaignSchema = z.object({
  reason: z.string().min(1, 'Motif requis').max(500),
});

export const updatePlatformSettingsSchema = z.object({
  platformName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  developerCommissionRate: z.number().min(0).max(1).optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  registrationOpen: z.boolean().optional(),
  maxFileUploadSize: z.number().int().positive().optional(),
  emailVerificationRequired: z.boolean().optional(),
  phoneVerificationRequired: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  autoBackupEnabled: z.boolean().optional(),
  backupFrequency: z.string().optional(),
  retentionDays: z.number().int().positive().optional(),
});

export const updateAfriScoreRulesSchema = z.object({
  weights: z.record(z.string(), z.number().min(0).max(1000)),
});


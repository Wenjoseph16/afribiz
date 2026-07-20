import { z } from 'zod';

export const createStageSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  order: z.number().int().min(0).optional(),
  color: z.string().optional(),
});

export const updateStageSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createDealSchema = z.object({
  stageId: z.string(),
  clientName: z.string().min(1, 'Le nom du client est requis'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  value: z.number().min(0).default(0),
  source: z
    .enum([
      'WEBSITE',
      'REFERRAL',
      'SOCIAL_MEDIA',
      'COLD_CALL',
      'EMAIL',
      'DIRECT',
      'MARKETPLACE',
      'OTHER',
    ])
    .optional(),
  probability: z.number().int().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateDealSchema = z.object({
  stageId: z.string().optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  source: z
    .enum([
      'WEBSITE',
      'REFERRAL',
      'SOCIAL_MEDIA',
      'COLD_CALL',
      'EMAIL',
      'DIRECT',
      'MARKETPLACE',
      'OTHER',
    ])
    .optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const moveDealSchema = z.object({
  stageId: z.string(),
  order: z.number().int().min(0).optional(),
});

import { z } from 'zod';

const shareLevels = ['NONE', 'BASIC', 'STANDARD', 'FULL'] as const;
const partnerTypes = ['BANK', 'INSURANCE', 'INVESTOR', 'GOVERNMENT', 'NGO', 'TECH', 'OTHER'] as const;

export const updateConsentSchema = z.object({
  shareLevel: z.enum(shareLevels).optional(),
  allowsBanks: z.boolean().optional(),
  allowsInsurance: z.boolean().optional(),
  allowsInvestors: z.boolean().optional(),
  allowsPublic: z.boolean().optional(),
  allowsAll: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createPartnerSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(200),
  slug: z.string().min(2, 'Slug requis').max(100),
  type: z.enum(partnerTypes),
  email: z.string().email('Email valide requis'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logo: z.string().optional(),
  description: z.string().optional(),
  apiKey: z.string().optional(),
  apiEnabled: z.boolean().optional().default(false),
  apiQuota: z.number().int().positive().optional().default(1000),
});

export const updatePartnerSchema = createPartnerSchema.partial();


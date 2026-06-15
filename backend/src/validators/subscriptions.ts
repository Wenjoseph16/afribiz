import { z } from 'zod';

const planTypes = ['STANDARD', 'PREMIUM', 'VIP', 'CUSTOM'] as const;
const billingCycles = ['MONTHLY', 'QUARTERLY', 'SEMESTRIAL', 'YEARLY', 'WEEKLY', 'DAILY'] as const;
const subscriptionStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL'] as const;
const paymentMethods = ['MANUAL', 'CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
const paymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(200),
  description: z.string().optional(),
  type: z.enum(planTypes).optional().default('STANDARD'),
  price: z.number().positive('Prix requis'),
  currency: z.string().optional().default('FCFA'),
  billingCycle: z.enum(billingCycles).optional().default('MONTHLY'),
  trialDays: z.number().int().min(0).optional().default(0),
  durationDays: z.number().int().positive('Durée requise'),
  maxUsage: z.number().int().min(0).optional(),
  maxClients: z.number().int().min(0).optional(),
  maxBookings: z.number().int().min(0).optional(),
  benefits: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
  featured: z.boolean().optional().default(false),
  badge: z.string().optional(),
  privileges: z.array(z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    value: z.any().optional(),
    valueType: z.string().optional(),
  })).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan requis'),
  clientId: z.string().min(1, 'Client requis'),
  autoRenew: z.boolean().optional().default(true),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  subscriptionId: z.string().min(1, 'Abonnement requis'),
  amount: z.number().positive('Montant requis'),
  currency: z.string().optional().default('FCFA'),
  method: z.enum(paymentMethods).optional().default('MANUAL'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  isManual: z.boolean().optional().default(false),
  verifiedBy: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});


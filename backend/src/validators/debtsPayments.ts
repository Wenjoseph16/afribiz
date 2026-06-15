import { z } from 'zod';

const debtStatuses = ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE', 'CRITICAL', 'DISPUTED', 'SETTLED', 'CANCELLED'] as const;
const debtPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const escrowStatuses = ['HELD', 'RELEASED', 'REFUNDED', 'DISPUTED'] as const;
const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const reminderChannels = ['WHATSAPP', 'SMS', 'PUSH', 'EMAIL'] as const;

export const updateDebtSchema = z.object({
  status: z.enum(debtStatuses).optional(),
  priority: z.enum(debtPriorities).optional(),
  riskLevel: z.enum(riskLevels).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.number().positive().optional(),
});

export const registerPaymentSchema = z.object({
  amount: z.number().positive('Montant requis'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  proofUrl: z.string().url().optional(),
});

export const updateDebtPrioritySchema = z.object({
  priority: z.enum(debtPriorities),
});

export const createEscrowSchema = z.object({
  orderId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive('Montant requis'),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

export const refundEscrowSchema = z.object({
  reason: z.string().optional(),
});

export const disputeEscrowSchema = z.object({
  reason: z.string().min(1, 'Motif requis'),
});

export const updateClientRiskSchema = z.object({
  riskLevel: z.enum(riskLevels).optional(),
  reliabilityScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
  blacklisted: z.boolean().optional(),
  requireDeposit: z.boolean().optional(),
  maxCreditAmount: z.number().positive().optional(),
});

export const sendReminderSchema = z.object({
  channel: z.enum(reminderChannels),
  content: z.string().optional(),
});

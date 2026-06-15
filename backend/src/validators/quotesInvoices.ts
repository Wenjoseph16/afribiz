import { z } from 'zod';

const quoteStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'] as const;
const invoiceStatuses = ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'] as const;

const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().min(0),
});

export const createQuoteSchema = z.object({
  title: z.string().min(2, 'Titre requis').max(300),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  items: z.array(quoteItemSchema).min(1, 'Au moins un article requis'),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  validityDays: z.number().int().positive().optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const updateQuoteStatusSchema = z.object({
  status: z.enum(quoteStatuses),
  reason: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  title: z.string().min(2, 'Titre requis').max(300),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  items: z.array(quoteItemSchema).min(1, 'Au moins un article requis'),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(invoiceStatuses),
  reason: z.string().optional(),
});

export const updateInvoicePaymentSchema = z.object({
  amount: z.number().positive('Montant requis'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

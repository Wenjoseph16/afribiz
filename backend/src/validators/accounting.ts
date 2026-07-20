import { z } from 'zod';

const expenseCategories = [
  'ACHATS',
  'LOYER',
  'SALAIRES',
  'CHARGES',
  'TRANSPORT',
  'COMMUNICATION',
  'MARKETING',
  'MAINTENANCE',
  'ASSURANCE',
  'FISCALITE',
  'BANCAIRE',
  'FORMATION',
  'EQUIPEMENT',
  'MATIERES_PREMIERES',
  'SERVICES_EXTERNES',
  'AUTRE',
] as const;

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  amount: z.number().positive('Montant doit être positif'),
  category: z.enum(expenseCategories, { message: 'Catégorie invalide' }),
  date: z.string({ required_error: 'Date requise' }),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  taxDeductible: z.boolean().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

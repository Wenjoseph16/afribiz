import { z } from 'zod';

const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const recurrenceTypes = ['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'] as const;

export const createChecklistItemSchema = z.object({
  label: z.string().min(1, 'Libellé requis').max(300),
  assignedTo: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Contenu requis').max(2000),
  attachment: z.string().optional(),
});

export const addResourceSchema = z.object({
  type: z.string().optional().default('document'),
  label: z.string().min(1, 'Libellé requis'),
  url: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
});

export const requestValidationSchema = z.object({
  type: z.string().optional().default('manager'),
  notes: z.string().optional(),
});

export const approveValidationSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const createTaskCategorySchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  color: z.string().optional().default('#6366f1'),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const reorderTaskSchema = z.object({
  status: z.string().min(1),
  sortOrder: z.number().int().min(0),
});

import { z } from 'zod';

const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const taskStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'BLOCKED', 'ON_HOLD', 'VALIDATION'] as const;
const taskRecurrences = ['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'] as const;

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Le titre est requis').max(300),
  description: z.string().optional(),
  priority: z.enum(taskPriorities).optional().default('MEDIUM'),
  status: z.enum(taskStatuses).optional().default('TODO'),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  orderId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  recurrence: z.enum(taskRecurrences).optional().default('NONE'),
  recurrenceRule: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const upsertScheduleSchema = z.object({
  employeeId: z.string().uuid('employeeId requis'),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  isActive: z.boolean().optional(),
});

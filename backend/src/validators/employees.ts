import { z } from 'zod';

const employeeStatuses = ['ACTIVE', 'SUSPENDED', 'ON_LEAVE', 'INACTIVE'] as const;
const attendanceMethods = ['MANUAL', 'QR_CODE', 'PIN', 'GPS'] as const;
const documentTypes = ['CONTRACT', 'ID_CARD', 'CV', 'CERTIFICATE', 'LICENSE', 'PERMIT', 'OTHER'] as const;
const performanceRatings = ['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR'] as const;
const employeePermissions = ['VIEW_ORDERS', 'MODIFY_STOCK', 'MANAGE_BOOKINGS', 'ACCESS_FINANCES', 'MANAGE_EMPLOYEES', 'REPLY_CLIENTS', 'VIEW_SCHEDULE', 'MANAGE_TASKS', 'VIEW_STATS'] as const;

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  photo: z.string().optional(),
  phone: z.string().min(1, 'Téléphone requis'),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  position: z.string().min(1, 'Poste requis').max(200),
  department: z.string().optional(),
  employeeRoleId: z.string().uuid().optional(),
  hireDate: z.string().optional(),
  salary: z.number().positive().optional(),
  salaryCurrency: z.string().optional().default('FCFA'),
  pinCode: z.string().optional(),
  status: z.enum(employeeStatuses).optional().default('ACTIVE'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const createEmployeeRoleSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  description: z.string().optional(),
  permissions: z.array(z.enum(employeePermissions)).optional().default([]),
  isDefault: z.boolean().optional().default(false),
});

export const updateEmployeeRoleSchema = createEmployeeRoleSchema.partial();

export const clockInSchema = z.object({
  employeeId: z.string().uuid('Employé requis'),
  method: z.enum(attendanceMethods).optional().default('MANUAL'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
});

export const markAbsentSchema = z.object({
  employeeId: z.string().uuid('Employé requis'),
  date: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const createEmployeeDocumentSchema = z.object({
  employeeId: z.string().uuid('Employé requis'),
  type: z.enum(documentTypes),
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  fileUrl: z.string().min(1, 'URL requise'),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const createEmployeePerformanceSchema = z.object({
  employeeId: z.string().uuid('Employé requis'),
  periodStart: z.string().min(1, 'Début requis'),
  periodEnd: z.string().min(1, 'Fin requise'),
  punctuality: z.number().int().min(0).max(100).optional(),
  tasksCompleted: z.number().int().min(0).optional(),
  tasksAssigned: z.number().int().min(0).optional(),
  salesGenerated: z.number().positive().optional(),
  clientSatisfaction: z.number().int().min(0).max(100).optional(),
  efficiency: z.number().int().min(0).max(100).optional(),
  rating: z.enum(performanceRatings).optional(),
  overallScore: z.number().int().min(0).max(100).optional(),
  reviewNotes: z.string().optional(),
});

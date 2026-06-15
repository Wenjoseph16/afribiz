import { z } from 'zod';

// ============================================
// SHARED ENUMS
// ============================================

const modulePermissionResourceEnum = z.enum([
  'PRODUCTS', 'SERVICES', 'BOOKINGS', 'ORDERS', 'CLIENTS',
  'CRM', 'MARKETING', 'PAYMENTS', 'ACCOUNTING', 'EMPLOYEES',
  'DELIVERIES', 'EVENTS', 'TRAININGS', 'RENTALS', 'SETTINGS',
  'DATA_EXPORT',
]);

const modulePermissionAccessEnum = z.enum(['READ', 'WRITE', 'ADMIN']);
const licenseTypeEnum = z.enum(['FREE', 'STANDARD', 'PREMIUM', 'ENTERPRISE', 'TRIAL']);

const webhookEventEnum = z.enum([
  'MODULE_SUBMITTED', 'MODULE_APPROVED', 'MODULE_REJECTED',
  'MODULE_INSTALLED', 'MODULE_UNINSTALLED', 'MODULE_SOLD',
  'MODULE_REVIEWED', 'MODULE_UPDATED', 'MODULE_LICENSE_EXPIRING',
  'MODULE_LICENSE_EXPIRED', 'MODULE_ERROR', 'PAYOUT_REQUESTED',
  'PAYOUT_COMPLETED', 'TICKET_CREATED', 'TICKET_RESOLVED',
]);

const validationStatusEnum = z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']);

// ============================================
// PERMISSIONS SCHEMAS
// ============================================

export const addModulePermissionSchema = z.object({
  resource: modulePermissionResourceEnum,
  accessLevel: modulePermissionAccessEnum,
  description: z.string().max(500).optional(),
  isRequired: z.boolean().optional().default(true),
});

export const checkModulePermissionsSchema = z.object({
  businessId: z.string().uuid('businessId invalide'),
});

// ============================================
// LICENSES SCHEMAS
// ============================================

export const createLicenseSchema = z.object({
  moduleId: z.string().uuid('moduleId invalide'),
  businessId: z.string().uuid('businessId invalide'),
  licenseType: licenseTypeEnum,
  price: z.number().positive('Le prix doit etre positif').optional(),
  currency: z.string().max(10).optional().default('FCFA'),
  expiresAt: z.string().datetime('Date invalide').optional().transform((s) => s ? new Date(s) : undefined),
  autoRenew: z.boolean().optional().default(false),
});

export const activateLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'Cle de licence requise').max(50),
});

export const revokeLicenseSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const renewLicenseSchema = z.object({
  durationDays: z.number().int().positive('La duree doit etre positive').optional().default(365),
});

export const checkLicenseQuerySchema = z.object({
  moduleId: z.string().uuid('moduleId invalide'),
  businessId: z.string().uuid('businessId invalide'),
});

// ============================================
// API KEYS SCHEMAS
// ============================================

export const createApiKeySchema = z.object({
  name: z.string().min(2, 'Le nom est requis (min 2 caracteres)').max(100),
  scopes: z.array(modulePermissionResourceEnum).optional().default([]),
  expiresAt: z.string().datetime('Date invalide').optional().transform((s) => s ? new Date(s) : undefined),
});

// ============================================
// WEBHOOKS SCHEMAS
// ============================================

export const createWebhookSchema = z.object({
  url: z.string().url('URL invalide').max(500),
  events: z.array(webhookEventEnum).min(1, 'Au moins un evenement requis'),
  moduleId: z.string().uuid('moduleId invalide').optional(),
});

export const getWebhookDeliveriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const trackAnalyticsSchema = z.object({
  event: z.string().min(1, "L'evenement est requis").max(100),
  metadata: z.record(z.unknown()).optional(),
});

export const getModuleAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const logModuleErrorSchema = z.object({
  errorType: z.string().min(1, "Le type d'erreur est requis").max(100),
  errorMessage: z.string().max(5000).optional(),
  stackTrace: z.string().optional(),
  businessId: z.string().uuid().optional(),
  installationId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const getModuleErrorsQuerySchema = z.object({
  resolved: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const approveValidationCheckSchema = z.object({
  score: z.number().int().min(0, 'Le score minimum est 0').max(100, 'Le score maximum est 100'),
  details: z.string().max(2000).optional(),
});

export const rejectValidationCheckSchema = z.object({
  details: z.string().min(1, 'Les details du rejet sont requis').max(2000),
});

export const completeValidationSchema = z.object({
  status: validationStatusEnum,
  notes: z.string().max(2000).optional(),
});

// ============================================
// CONFIGURATION SCHEMAS
// ============================================

export const saveModuleConfigurationSchema = z.object({
  businessId: z.string().uuid('businessId invalide'),
  installationId: z.string().uuid('installationId invalide'),
  settings: z.record(z.unknown()).default({}),
});

export const toggleModuleActiveSchema = z.object({
  businessId: z.string().uuid('businessId invalide'),
  isActive: z.boolean(),
});

export const getModuleConfigurationQuerySchema = z.object({
  businessId: z.string().uuid('businessId invalide'),
});

// ============================================
// ACTIVITY LOG SCHEMAS
// ============================================

export const logActivitySchema = z.object({
  activityType: z.string().min(1, "Le type d'activite est requis").max(100),
  businessId: z.string().uuid().optional(),
  installationId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const getActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type AddModulePermissionInput = z.infer<typeof addModulePermissionSchema>;
export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;
export type ActivateLicenseInput = z.infer<typeof activateLicenseSchema>;
export type RevokeLicenseInput = z.infer<typeof revokeLicenseSchema>;
export type RenewLicenseInput = z.infer<typeof renewLicenseSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type TrackAnalyticsInput = z.infer<typeof trackAnalyticsSchema>;
export type LogModuleErrorInput = z.infer<typeof logModuleErrorSchema>;
export type ApproveValidationCheckInput = z.infer<typeof approveValidationCheckSchema>;
export type RejectValidationCheckInput = z.infer<typeof rejectValidationCheckSchema>;
export type CompleteValidationInput = z.infer<typeof completeValidationSchema>;
export type SaveModuleConfigurationInput = z.infer<typeof saveModuleConfigurationSchema>;
export type ToggleModuleActiveInput = z.infer<typeof toggleModuleActiveSchema>;
export type LogActivityInput = z.infer<typeof logActivitySchema>;

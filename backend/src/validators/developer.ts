import { z } from 'zod';

const pricingTypeEnum = z.enum(['FREE', 'ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTRIAL', 'YEARLY', 'CUSTOM']);
const moduleStatusEnum = z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']);
const ticketPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);
const ticketCategoryEnum = z.enum(['BUG', 'FEATURE', 'QUESTION', 'OTHER']);
const ticketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']);

export const activateDeveloperSchema = z.object({});

export const updateProfileSchema = z.object({
  developerName: z.string().min(2).max(100).optional(),
  companyName: z.string().min(2).max(100).optional(),
  photo: z.string().url().optional().or(z.literal('')),
  companyLogo: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(4).optional(),
  whatsapp: z.string().optional(),
  professionalEmail: z.string().email().optional(),
  country: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().optional(),
  gitlab: z.string().optional(),
  portfolio: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().optional(),
  yearsOfExperience: z.number().int().min(0).max(100).optional(),
  specialties: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  presentation: z.string().max(2000).optional(),
  publicDescription: z.string().max(5000).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
});

export const submitVerificationSchema = z.object({
  identityDoc: z.string().min(1, "Le document d'identité est requis"),
  companyDoc: z.string().min(1, 'Le document de la société est requis'),
  responsiblePhoto: z.string().min(1, 'La photo du responsable est requise'),
});

export const createModuleSchema = z.object({
  name: z.string().min(2, 'Le nom du module est requis').max(100),
  category: z.string().min(2, 'La catégorie est requise'),
  shortDescription: z.string().min(10, 'Description trop courte').max(300, 'Maximum 300 caractères'),
  pricingType: pricingTypeEnum,
  price: z.number().positive().optional(),
  currency: z.string().default('FCFA'),
  fullDescription: z.string().max(10000).optional(),
  logo: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  subcategory: z.string().optional(),
  demoVideo: z.string().optional(),
  documentation: z.string().optional(),
  installationGuide: z.string().optional(),
  hasFreeVersion: z.boolean().optional().default(false),
  hasPremiumVersion: z.boolean().optional().default(false),
  freeVersionFeatures: z.array(z.string()).optional().default([]),
  premiumVersionFeatures: z.array(z.string()).optional().default([]),
  termsOfUse: z.string().optional(),
  supportPolicy: z.string().optional(),
  licenseType: z.string().optional(),
  requires: z.array(z.string()).optional().default([]),
});

export const updateModuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: z.string().min(2).optional(),
  shortDescription: z.string().min(10).max(300).optional(),
  pricingType: pricingTypeEnum.optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  fullDescription: z.string().max(10000).optional(),
  logo: z.string().optional(),
  images: z.array(z.string()).optional(),
  subcategory: z.string().optional(),
  demoVideo: z.string().optional(),
  documentation: z.string().optional(),
  installationGuide: z.string().optional(),
  hasFreeVersion: z.boolean().optional(),
  hasPremiumVersion: z.boolean().optional(),
  freeVersionFeatures: z.array(z.string()).optional(),
  premiumVersionFeatures: z.array(z.string()).optional(),
  termsOfUse: z.string().optional(),
  supportPolicy: z.string().optional(),
  licenseType: z.string().optional(),
  requires: z.array(z.string()).optional(),
});

export const createVersionSchema = z.object({
  version: z.string().min(1, 'Le numéro de version est requis').regex(/^\d+\.\d+\.\d+$/, 'Format SemVer requis (x.y.z)'),
  releaseNotes: z.string().optional(),
  changelog: z.string().optional(),
  documentationUrl: z.string().url().optional().or(z.literal('')),
  installScript: z.string().optional(),
  uninstallScript: z.string().optional(),
  minAppVersion: z.string().optional(),
  isBreaking: z.boolean().optional().default(false),
  downloadUrl: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  checksum: z.string().optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'La note minimale est 1').max(5, 'La note maximale est 5'),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const createTicketSchema = z.object({
  subject: z.string().min(5, 'Le sujet est requis (min 5 caractères)').max(200),
  description: z.string().min(10, 'La description est requise (min 10 caractères)').max(5000),
  priority: ticketPriorityEnum.optional().default('NORMAL'),
  category: ticketCategoryEnum.optional().default('OTHER'),
  moduleId: z.string().uuid().optional(),
});

export const replyTicketSchema = z.object({
  content: z.string().min(1, 'Le message est requis').max(5000),
});

export const requestPayoutSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  method: z.string().min(1, 'Le moyen de paiement est requis'),
  currency: z.string().optional().default('FCFA'),
  notes: z.string().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: ticketStatusEnum,
});

export type ActivateDeveloperInput = z.infer<typeof activateDeveloperSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;
export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

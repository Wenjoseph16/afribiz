import { z } from 'zod';
import {
  businessTypeEnum as sharedBusinessTypeEnum,
  businessModuleEnum as sharedBusinessModuleEnum,
} from '@afribiz/shared';

const businessTypeEnum = sharedBusinessTypeEnum;
const businessModuleEnum = sharedBusinessModuleEnum;

export const onboardingSchema = z.object({
  name: z.string().min(2, 'Le nom du business est requis').max(100),
  type: businessTypeEnum,
  shortDescription: z
    .string()
    .min(10, 'Description trop courte')
    .max(300, 'Maximum 300 caractères'),
  phone: z.string().min(4, 'Numéro de téléphone requis'),
  whatsapp: z.string().optional(),
  address: z.string().min(5, "L'adresse est requise"),
  region: z.string().optional(),
  city: z.string().min(2, 'La ville est requise'),
  country: z.string().min(2, 'Le pays est requis'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  managerName: z.string().max(100).optional(),
  managerBio: z.string().max(500).optional(),
  experience: z.number().int().min(0).max(100).optional(),
  skills: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  certificationImages: z.array(z.string()).optional().default([]),
  website: z.string().url().optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  language: z.string().optional(),
  modules: z.array(businessModuleEnum).min(1, 'Sélectionnez au moins un module'),
  // Onboarding Steps 2-4
  openingHours: z
    .record(
      z.object({
        open: z.string().optional(),
        close: z.string().optional(),
        closed: z.boolean().optional(),
      })
    )
    .optional()
    .default({}),
  portfolio: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const businessThemeSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide')
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide')
    .optional(),
  borderRadius: z.enum(['sm', 'md', 'xl', '2xl']).optional(),
  fontFamily: z.enum(['inter', 'geist', 'system']).optional(),
  enableAnimations: z.boolean().optional(),
  layout: z.enum(['standard', 'compact', 'elegant']).optional(),
  sectionVisibility: z.record(z.string(), z.boolean()).optional(),
});

export const publicPageSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide')
    .optional(),
  shortDescription: z.string().max(150).optional(),
  description: z.string().optional(),
  tagline: z.string().max(200).optional(),
  phone: z.string().min(4).optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  googleMapsLink: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
  theme: businessThemeSchema.optional(),
  gallery: z.array(z.string()).max(10, 'Maximum 10 photos').optional(),
  hours: z
    .array(
      z.object({
        day: z.string(),
        open: z.string().optional(),
        close: z.string().optional(),
        isClosed: z.boolean().optional(),
      })
    )
    .optional(),
});

export const businessVerificationSchema = z.object({
  identityDocument: z.string().min(1, "La pièce d'identité est requise"),
  companyDocument: z.string().min(1, "Le document d'entreprise est requis"),
  taxDocument: z.string().optional(),
  responsiblePhoto: z.string().min(1, 'La photo du responsable est requise'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type PublicPageInput = z.infer<typeof publicPageSchema>;
export type BusinessThemeInput = z.infer<typeof businessThemeSchema>;

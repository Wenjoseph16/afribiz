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
    .max(150, 'Maximum 150 caractères'),
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
  website: z.string().url().optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  language: z.string().optional(),
  modules: z.array(businessModuleEnum).min(1, 'Sélectionnez au moins un module'),
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

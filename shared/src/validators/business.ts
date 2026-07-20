import { z } from 'zod';

export const businessTypeEnum = z.enum([
  'RESTAURANT',
  'FAST_FOOD',
  'PATISSERIE',
  'BOULANGERIE',
  'CAFE',
  'BAR',
  'HOTEL',
  'AUBERGE',
  'MAISON_D_HOTES',
  'LOCATION_SAISONNIERE',
  'BOUTIQUE_VETEMENTS',
  'BOUTIQUE_CHAUSSURES',
  'BOUTIQUE_COSMETIQUES',
  'BOUTIQUE_INFORMATIQUE',
  'BOUTIQUE_TELEPHONIQUE',
  'BOUTIQUE_ELECTRONIQUE',
  'SUPERMARCHE',
  'EPICERIE',
  'PHARMACIE',
  'LIBRAIRIE',
  'PAPETERIE',
  'SALON_COIFFURE',
  'SALON_BEAUTE',
  'SPA',
  'INSTITUT_ESTHETIQUE',
  'PHOTOGRAPHE',
  'VIDEOASTE',
  'AGENCE_MARKETING',
  'AGENCE_COMMUNICATION',
  'AGENCE_DIGITALE',
  'AGENCE_IMMOBILIERE',
  'CABINET_JURIDIQUE',
  'CABINET_COMPTABLE',
  'CABINET_CONSEIL',
  'CABINET_MEDICAL',
  'CLINIQUE',
  'CENTRE_FORMATION',
  'ECOLE_PRIVEE',
  'FREELANCE',
  'DEVELOPPEUR',
  'DESIGNER_GRAPHIQUE',
  'CONSULTANT',
  'COACH_PROFESSIONNEL',
  'ARTISAN',
  'MENUISIER',
  'MACON',
  'PLOMBIER',
  'ELECTRICIEN',
  'SOUDEUR',
  'MECANICIEN',
  'ENTREPRISE_AGRICOLE',
  'ELEVAGE',
  'TRANSPORT',
  'LIVRAISON',
  'ORGANISATION_EVENEMENTS',
  'LOCATION_VEHICULES',
  'LOCATION_EQUIPEMENTS',
  'LOCATION_ENGINS',
  'IMPORT_EXPORT',
  'ASSOCIATION',
  'ONG',
  'ENTREPRISE_PRIVEE',
  'AUTRE',
]);

export const businessModuleEnum = z.enum([
  'PRODUCTS',
  'SERVICES',
  'MENU',
  'ROOMS',
  'BOOKINGS',
  'ORDERS',
  'QUOTES_INVOICES',
  'DEBTS_PAYMENTS',
  'PROMOTIONS',
  'PLANNING',
  'EMPLOYEES',
  'PORTFOLIO',
  'SUBSCRIPTIONS',
  'DELIVERIES',
  'EVENTS',
  'RENTALS',
  'DOCUMENTS',
  'PARTNERS',
  'DISPUTES',
  'MODULE_MARKETPLACE',
  'ADVANCED_TASKS',
]);

export const businessOnboardingSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  type: businessTypeEnum,
  shortDescription: z.string().min(10, 'Description trop courte').max(200).optional(),
  phone: z.string().min(1, 'Téléphone requis'),
  whatsapp: z.string().optional(),
  address: z.string().min(1, 'Adresse requise'),
  country: z.string().min(1, 'Pays requis'),
  region: z.string().optional(),
  city: z.string().min(1, 'Ville requise'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  modules: z.array(businessModuleEnum).min(1, 'Sélectionnez au moins un module'),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  managerName: z.string().optional(),
  experience: z.number().int().min(0).max(100).optional(),
  managerBio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  website: z.string().url().optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  language: z.string().optional(),
  paymentMethods: z
    .array(
      z.object({
        method: z.string(),
        name: z.string(),
        number: z.string(),
        isActive: z.boolean(),
      })
    )
    .optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(150),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  price: z.number().positive('Prix doit être positif'),
  currency: z.string().default('XOF'),
  comparePrice: z.number().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional(),
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

export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PublicPageInput = z.infer<typeof publicPageSchema>;

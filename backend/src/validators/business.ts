import { z } from 'zod';

const businessTypeEnum = z.enum([
  'RESTAURANT', 'FAST_FOOD', 'PATISSERIE', 'BOULANGERIE',
  'CAFE', 'BAR', 'HOTEL', 'AUBERGE', 'MAISON_D_HOTES',
  'LOCATION_SAISONNIERE', 'BOUTIQUE_VETEMENTS', 'BOUTIQUE_CHAUSSURES',
  'BOUTIQUE_COSMETIQUES', 'BOUTIQUE_INFORMATIQUE', 'BOUTIQUE_TELEPHONIQUE',
  'BOUTIQUE_ELECTRONIQUE', 'SUPERMARCHE', 'EPICERIE', 'PHARMACIE',
  'LIBRAIRIE', 'PAPETERIE', 'SALON_COIFFURE', 'SALON_BEAUTE',
  'SPA', 'INSTITUT_ESTHETIQUE', 'PHOTOGRAPHE', 'VIDEOASTE',
  'AGENCE_MARKETING', 'AGENCE_COMMUNICATION', 'AGENCE_DIGITALE',
  'AGENCE_IMMOBILIERE', 'CABINET_JURIDIQUE', 'CABINET_COMPTABLE',
  'CABINET_CONSEIL', 'CABINET_MEDICAL', 'CLINIQUE',
  'CENTRE_FORMATION', 'ECOLE_PRIVEE', 'FREELANCE', 'DEVELOPPEUR',
  'DESIGNER_GRAPHIQUE', 'CONSULTANT', 'COACH_PROFESSIONNEL',
  'ARTISAN', 'MENUISIER', 'MACON', 'PLOMBIER', 'ELECTRICIEN',
  'SOUDEUR', 'MECANICIEN', 'ENTREPRISE_AGRICOLE', 'ELEVAGE',
  'TRANSPORT', 'LIVRAISON', 'ORGANISATION_EVENEMENTS',
  'LOCATION_VEHICULES', 'LOCATION_EQUIPEMENTS', 'LOCATION_ENGINS',
  'IMPORT_EXPORT', 'ASSOCIATION', 'ONG', 'ENTREPRISE_PRIVEE', 'AUTRE',
]);

const businessModuleEnum = z.enum([
  'PRODUCTS', 'SERVICES', 'MENU', 'ROOMS', 'BOOKINGS', 'ORDERS',
  'QUOTES_INVOICES', 'DEBTS_PAYMENTS', 'PROMOTIONS', 'PLANNING',
  'EMPLOYEES', 'PORTFOLIO', 'SUBSCRIPTIONS', 'DELIVERIES', 'EVENTS',
  'RENTALS', 'DOCUMENTS', 'PARTNERS', 'DISPUTES', 'MODULE_MARKETPLACE',
  'ADVANCED_TASKS',
]);

export const onboardingSchema = z.object({
  name: z.string().min(2, 'Le nom du business est requis').max(100),
  type: businessTypeEnum,
  shortDescription: z.string().min(10, 'Description trop courte').max(150, 'Maximum 150 caractères'),
  phone: z.string().min(4, 'Numéro de téléphone requis'),
  whatsapp: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  country: z.string().default('Togo'),
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
  linkedin: z.string().optional(),
  modules: z.array(businessModuleEnum).min(1, 'Sélectionnez au moins un module'),
});

export const publicPageSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug invalide').optional(),
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
  hours: z.array(z.object({
    day: z.string(),
    open: z.string().optional(),
    close: z.string().optional(),
    isClosed: z.boolean().optional(),
  })).optional(),
});

export const businessVerificationSchema = z.object({
  identityDocument: z.string().min(1, "La pièce d'identité est requise"),
  companyDocument: z.string().min(1, 'Le document d\'entreprise est requis'),
  taxDocument: z.string().optional(),
  responsiblePhoto: z.string().min(1, 'La photo du responsable est requise'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type PublicPageInput = z.infer<typeof publicPageSchema>;

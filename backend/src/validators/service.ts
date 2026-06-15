import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Le nom du service est requis').max(200),
  shortDescription: z.string().max(200).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  price: z.number().positive('Le prix doit \u00eatre positif').optional(),
  priceType: z.enum(['FIXED', 'VARIABLE', 'FROM']).optional().default('FIXED'),
  minPrice: z.number().positive().optional(),
  currency: z.string().default('FCFA'),
  isPromotional: z.boolean().default(false),
  promotionalPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  promotionEndsAt: z.string().optional(),
  duration: z.number().int().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  durationMax: z.number().int().positive().optional(),
  availability: z.enum(['ALWAYS', 'CUSTOM', 'APPOINTMENT_ONLY']).optional().default('ALWAYS'),
  bookingRequired: z.boolean().default(true),
  depositRequired: z.boolean().default(false),
  depositAmount: z.number().positive().optional(),
  autoConfirm: z.boolean().default(false),
  locationType: z.enum(['ON_SITE', 'AT_HOME', 'ONLINE', 'HYBRID']).optional().default('ON_SITE'),
  isActive: z.boolean().default(true),
  isVisibleOnPublicPage: z.boolean().default(true),
  isVisibleOnMarketplace: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featured: z.boolean().default(false),
  employees: z.array(z.object({ name: z.string(), title: z.string().optional(), photo: z.string().optional(), bio: z.string().optional() })).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Le nom est requis').max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

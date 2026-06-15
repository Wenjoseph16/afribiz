import { z } from 'zod';

const mediaTypes = ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER'] as const;
const interactionTypes = ['LIKE', 'SHARE', 'COMMENT', 'CONTACT', 'VIEW'] as const;

export const createPortfolioItemSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().min(2, 'Titre requis').max(300),
  description: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  beforeImage: z.string().optional(),
  afterImage: z.string().optional(),
  clientName: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().min(0).optional(),
  currency: z.string().optional().default('FCFA'),
  duration: z.string().optional(),
  resultsText: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  projectDate: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  featured: z.boolean().optional().default(false),
});

export const updatePortfolioItemSchema = createPortfolioItemSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const addMediaSchema = z.object({
  portfolioItemId: z.string().min(1, 'Élément portfolio requis'),
  type: z.enum(mediaTypes).optional().default('IMAGE'),
  url: z.string().min(1, 'URL requise'),
  title: z.string().optional(),
  description: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const createTestimonialSchema = z.object({
  portfolioItemId: z.string().optional(),
  clientName: z.string().min(1, 'Nom client requis').max(200),
  clientPhoto: z.string().optional(),
  clientCompany: z.string().optional(),
  text: z.string().min(1, 'Texte requis').max(2000),
  rating: z.number().int().min(1).max(5).optional().default(5),
  projectDate: z.string().optional(),
  isPinned: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export const recordInteractionSchema = z.object({
  portfolioItemId: z.string().min(1, 'Élément portfolio requis'),
  type: z.enum(interactionTypes),
  visitorId: z.string().optional(),
  visitorName: z.string().optional(),
  comment: z.string().optional(),
  metadata: z.any().optional(),
});


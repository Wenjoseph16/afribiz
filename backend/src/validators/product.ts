import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Le nom du produit est requis').max(200),
  shortDescription: z.string().max(150).optional(),
  description: z.string().optional(),
  brand: z.string().max(100).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  price: z.number().positive('Le prix doit \u00eatre positif'),
  currency: z.string().default('FCFA'),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  unit: z.string().default('piece'),
  isOnPreOrder: z.boolean().default(false),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  isPromotional: z.boolean().default(false),
  promotionalPrice: z.number().positive().optional(),
  promotionEndsAt: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  deliveryFee: z.number().positive().optional(),
  isPhysical: z.boolean().default(true),
  isVisibleOnPublicPage: z.boolean().default(true),
  isVisibleOnMarketplace: z.boolean().default(true),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(300).optional(),
  variants: z.array(z.object({
    name: z.string().min(1, 'Le nom de la variante est requis'),
    sku: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).default(0),
    image: z.string().optional(),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Le nom de la cat\u00e9gorie est requis').max(100),
  description: z.string().max(300).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const updateStockSchema = z.object({
  stock: z.number().int().min(0, 'Le stock ne peut pas \u00eatre n\u00e9gatif'),
});

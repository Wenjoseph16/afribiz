import { z } from 'zod';

const menuItemTypes = ['BREAKFAST','LUNCH','DINNER','SNACK','DESSERT','DRINK','COCKTAIL','SPECIAL','EVENT'] as const;
const menuItemStatuses = ['AVAILABLE','OUT_OF_STOCK','DISABLED','PROMO'] as const;
const orderTypes = ['DINE_IN','TAKEAWAY','DELIVERY','ONLINE'] as const;
const orderStatuses = ['PENDING','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED'] as const;
const tableStatuses = ['FREE','RESERVED','OCCUPIED','CLEANING'] as const;
const tableLocations = ['SALLE','TERRASSE','VIP','JARDIN','BAR'] as const;
const ingredientCategories = ['LEGUME','VIANDE','POISSON','EPICE','LAITAGE','BOISSON','AUTRE'] as const;
const variantTypes = ['SIZE','PORTION','FLAVOR','SPICE_LEVEL','SUPPLEMENT'] as const;

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(200),
  shortDescription: z.string().max(200).optional(),
  description: z.string().optional(),
  type: z.enum(menuItemTypes).optional().default('LUNCH'),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive(),
  currency: z.string().default('FCFA'),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  isPromotional: z.boolean().default(false),
  promotionalPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  promotionEndsAt: z.string().optional(),
  status: z.enum(menuItemStatuses).optional().default('AVAILABLE'),
  isPopular: z.boolean().default(false),
  isStar: z.boolean().default(false),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(variantTypes).default('SIZE'),
    price: z.number().positive(),
    currency: z.string().default('FCFA'),
    stock: z.number().int().default(0),
    isAvailable: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const updateMenuItemStatusSchema = z.object({
  status: z.enum(menuItemStatuses),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createOrderSchema = z.object({
  tableId: z.string().uuid().optional(),
  type: z.enum(orderTypes).optional().default('DINE_IN'),
  source: z.string().optional().default('MANUAL'),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  paymentMethod: z.string().optional(),
  deliveryFee: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    name: z.string(),
    variantName: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
  cancelReason: z.string().optional(),
});

export const createTableSchema = z.object({
  tableNumber: z.string().min(1),
  capacity: z.number().int().positive().default(2),
  location: z.enum(tableLocations).optional(),
  status: z.enum(tableStatuses).optional().default('FREE'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateTableSchema = createTableSchema.partial();

export const updateTableStatusSchema = z.object({
  status: z.enum(tableStatuses),
});

export const createIngredientSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  category: z.enum(ingredientCategories).optional(),
  unit: z.string().min(1),
  unitPrice: z.number().positive().optional(),
  currentStock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().positive().optional(),
  threshold: z.number().min(0).default(0),
  alertEnabled: z.boolean().default(true),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export const adjustStockSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'WASTE']),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  serviceId: z.string().optional(),
  name: z.string().min(1, 'Le nom est requis'),
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1'),
  unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
  image: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1'),
  notes: z.string().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Le code promo est requis'),
});

export const checkoutSchema = z.object({
  type: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN', 'TAKEAWAY']).default('DELIVERY'),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  contactPhone: z.string().optional(),
  contactName: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT_CARD', 'ESCROW', 'CASH']).default('MOBILE_MONEY'),
});

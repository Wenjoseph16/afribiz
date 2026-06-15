import { z } from 'zod';

export const createOrderSchema = z.object({
  buyerId: z.string().optional(),
  type: z.enum(['DELIVERY','PICKUP','DINE_IN','TAKEAWAY']).optional(),
  source: z.enum(['WEB_SITE','MARKETPLACE','WHATSAPP','PHONE','WALK_IN']).optional(),
  status: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().nullable(),
  tax: z.number().optional(),
  deliveryFee: z.number().optional(),
  discount: z.number().optional(),
  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  deliveryZoneId: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  internalNotes: z.string().optional(),
  depositAmount: z.number().optional(),
  debtDueDate: z.string().optional(),
  debtNotes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    variantId: z.string().optional(),
    menuItemId: z.string().optional(),
    serviceId: z.string().optional(),
    name: z.string(),
    variantName: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    notes: z.string().optional(),
  })).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING','CONFIRMED','PREPARING','SHIPPED','DELIVERED','CANCELLED','REFUNDED']),
  reason: z.string().optional(),
});

export const updateDeliverySchema = z.object({
  deliveryStatus: z.enum(['PENDING','ASSIGNED','IN_TRANSIT','DELAYED','DELIVERED','FAILED']),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  paidAmount: z.number().optional(),
  depositAmount: z.number().optional(),
  depositPaid: z.boolean().optional(),
});

export const payDebtSchema = z.object({
  amount: z.number().positive(),
});

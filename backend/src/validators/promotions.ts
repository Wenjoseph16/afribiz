import { z } from 'zod';

const promoTypes = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'LOYALTY'] as const;
const promoStatuses = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'SCHEDULED'] as const;
const targetTypes = ['ALL', 'PRODUCTS', 'MENU_ITEMS', 'CATEGORIES', 'SERVICES'] as const;
const discountTypes = ['PERCENTAGE', 'FIXED'] as const;
const campaignChannels = ['WHATSAPP', 'SMS', 'EMAIL', 'PUSH', 'SOCIAL'] as const;
const audienceTypes = ['ALL', 'NEW_CLIENTS', 'VIP', 'LOYAL', 'INACTIVE'] as const;

export const createPromotionSchema = z.object({
  title: z.string().min(2, 'Titre requis').max(200),
  description: z.string().optional(),
  promotionType: z.enum(promoTypes).optional().default('PERCENTAGE'),
  discountValue: z.number().positive('Valeur de réduction requise'),
  code: z.string().optional(),
  targetType: z.enum(targetTypes).optional().default('ALL'),
  targetIds: z.array(z.string()).optional().default([]),
  minOrderAmount: z.number().min(0).optional(),
  maxUsageCount: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  conditions: z.any().optional(),
  badgeLabel: z.string().optional(),
  image: z.string().optional(),
  bannerImage: z.string().optional(),
  autoApply: z.boolean().optional().default(false),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const createCouponSchema = z.object({
  promotionId: z.string().optional(),
  clientId: z.string().optional(),
  code: z.string().optional(),
  discountValue: z.number().positive().optional(),
  discountType: z.enum(discountTypes).optional(),
  maxUses: z.number().int().positive().optional().default(1),
  minOrderAmount: z.number().min(0).optional(),
  isNewCustomer: z.boolean().optional().default(false),
  isVipOnly: z.boolean().optional().default(false),
  expiresAt: z.string().optional(),
});

export const createBundleSchema = z.object({
  promotionId: z.string().optional(),
  name: z.string().min(2, 'Nom requis').max(200),
  description: z.string().optional(),
  bundlePrice: z.number().positive('Prix du pack requis'),
  image: z.string().optional(),
  items: z.array(z.object({
    itemType: z.string().optional().default('PRODUCT'),
    itemId: z.string().min(1, 'ID article requis'),
    quantity: z.number().int().positive().optional().default(1),
  })).min(1, 'Au moins un article requis'),
});

export const createCampaignSchema = z.object({
  promotionId: z.string().optional(),
  name: z.string().min(2, 'Nom requis').max(200),
  description: z.string().optional(),
  channels: z.array(z.enum(campaignChannels)).optional().default(['WHATSAPP']),
  targetAudience: z.enum(audienceTypes).optional().default('ALL'),
  scheduledAt: z.string().optional(),
  message: z.string().optional(),
  image: z.string().optional(),
});

export const updateLoyaltySchema = z.object({
  isActive: z.boolean().optional(),
  pointsPerAmount: z.number().min(0).optional(),
  pointsValue: z.number().min(0).optional(),
  expiryDays: z.number().int().positive().optional(),
  autoEnroll: z.boolean().optional(),
  tiers: z.any().optional(),
  bronzeMinPoints: z.number().int().min(0).optional(),
  silverMinPoints: z.number().int().min(0).optional(),
  goldMinPoints: z.number().int().min(0).optional(),
  platinumMinPoints: z.number().int().min(0).optional(),
  cashbackPercent: z.number().min(0).max(100).optional(),
  birthdayBonus: z.number().int().min(0).optional(),
  birthdayPromoId: z.string().optional(),
});


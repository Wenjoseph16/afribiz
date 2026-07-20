import { DomainEventType } from '../events';
import { def } from './helpers';

export const publishProductPublished = def<{
  userId: string;
  productId: string;
  businessId: string;
  productName: string;
}>(
  DomainEventType.PRODUCT_PUBLISHED,
  (p) => ({ productId: p.productId, productName: p.productName }),
  (p) => ({ productId: p.productId, businessId: p.businessId, link: '/dashboard/products' })
);
export const publishProductModified = def<{
  userId: string;
  productId: string;
  businessId: string;
  productName: string;
}>(
  DomainEventType.PRODUCT_MODIFIED,
  (p) => ({ productId: p.productId, productName: p.productName }),
  (p) => ({ productId: p.productId, businessId: p.businessId, link: '/dashboard/products' })
);
export const publishProductDeleted = def<{
  userId: string;
  productId: string;
  businessId: string;
  productName: string;
}>(
  DomainEventType.PRODUCT_DELETED,
  (p) => ({ productId: p.productId, productName: p.productName }),
  (p) => ({ productId: p.productId, businessId: p.businessId, link: '/dashboard/products' })
);
export const publishLowStock = def<{
  userId: string;
  productId: string;
  businessId: string;
  productName: string;
  remainingStock: number;
}>(
  DomainEventType.LOW_STOCK,
  (p) => ({ productId: p.productId, productName: p.productName, remainingStock: p.remainingStock }),
  (p) => ({ productId: p.productId, businessId: p.businessId, link: '/dashboard/products' })
);
export const publishOutOfStock = def<{
  userId: string;
  productId: string;
  businessId: string;
  productName: string;
}>(
  DomainEventType.OUT_OF_STOCK,
  (p) => ({ productId: p.productId, productName: p.productName }),
  (p) => ({ productId: p.productId, businessId: p.businessId, link: '/dashboard/products' })
);
export const publishBackInStock = def<{
  userId: string;
  productId: string;
  businessId: string;
  productName: string;
}>(
  DomainEventType.BACK_IN_STOCK,
  (p) => ({ productId: p.productId, productName: p.productName }),
  (p) => ({ productId: p.productId, businessId: p.businessId, link: '/dashboard/products' })
);
export const publishServicePublished = def<{
  userId: string;
  serviceId: string;
  businessId: string;
  serviceName: string;
}>(
  DomainEventType.SERVICE_PUBLISHED,
  (p) => ({ serviceId: p.serviceId, serviceName: p.serviceName }),
  (p) => ({ serviceId: p.serviceId, businessId: p.businessId, link: '/dashboard/services' })
);
export const publishPromotionStarted = def<{
  userId: string;
  businessId: string;
  promotionId: string;
  promotionName: string;
}>(
  DomainEventType.PROMOTION_STARTED,
  (p) => ({ promotionId: p.promotionId, promotionName: p.promotionName }),
  (p) => ({ promotionId: p.promotionId, businessId: p.businessId, link: '/dashboard/promotions' })
);
export const publishFlashSaleStarted = def<{
  userId: string;
  businessId: string;
  promotionId: string;
  promotionName: string;
}>(
  DomainEventType.FLASH_SALE_STARTED,
  (p) => ({ promotionId: p.promotionId, promotionName: p.promotionName }),
  (p) => ({ promotionId: p.promotionId, businessId: p.businessId, link: '/dashboard/promotions' })
);
export const publishCartItemAdded = def<{
  userId: string;
  productId?: string;
  name: string;
  quantity: number;
}>(
  DomainEventType.CART_ITEM_ADDED,
  (p) => ({ productId: p.productId, name: p.name, quantity: p.quantity }),
  (p) => ({ productId: p.productId, link: '/dashboard/cart' })
);
export const publishCartItemUpdated = def<{ userId: string; productId?: string; quantity: number }>(
  DomainEventType.CART_ITEM_UPDATED,
  (p) => ({ productId: p.productId, quantity: p.quantity }),
  (p) => ({ productId: p.productId, link: '/dashboard/cart' })
);
export const publishCartItemRemoved = def<{ userId: string; productId?: string }>(
  DomainEventType.CART_ITEM_REMOVED,
  (p) => ({ productId: p.productId }),
  (p) => ({ productId: p.productId, link: '/dashboard/cart' })
);
export const publishCheckoutInitiated = def<{
  userId: string;
  itemCount: number;
  totalAmount: string;
}>(
  DomainEventType.CHECKOUT_INITIATED,
  (p) => ({ itemCount: p.itemCount, totalAmount: p.totalAmount }),
  (p) => ({ amount: p.totalAmount, link: '/dashboard/cart/checkout' })
);
export const publishCheckoutCompleted = def<{
  userId: string;
  orderId: string;
  totalAmount: string;
}>(
  DomainEventType.CHECKOUT_COMPLETED,
  (p) => ({ orderId: p.orderId, totalAmount: p.totalAmount }),
  (p) => ({ orderId: p.orderId, amount: p.totalAmount, link: `/dashboard/orders/${p.orderId}` })
);
export const publishCouponApplied = def<{ userId: string; code: string; discount: string }>(
  DomainEventType.COUPON_APPLIED,
  (p) => ({ code: p.code, discount: p.discount }),
  (_p) => ({ link: '/dashboard/cart' })
);
export const publishCampaignScheduled = def<{
  userId: string;
  businessId: string;
  campaignId: string;
}>(
  DomainEventType.CAMPAIGN_SCHEDULED,
  (p) => ({ campaignId: p.campaignId }),
  (p) => ({ campaignId: p.campaignId, businessId: p.businessId, link: '/dashboard/marketing' })
);
export const publishCampaignSent = def<{
  userId: string;
  businessId: string;
  campaignId: string;
  channel: string;
}>(
  DomainEventType.CAMPAIGN_SENT,
  (p) => ({ campaignId: p.campaignId, channel: p.channel }),
  (p) => ({
    campaignId: p.campaignId,
    businessId: p.businessId,
    channel: p.channel,
    link: '/dashboard/marketing',
  })
);
export const publishAdCreated = def<{
  userId: string;
  adId: string;
  businessId: string;
  businessName: string;
}>(
  DomainEventType.AD_CREATED,
  (p) => ({ adId: p.adId, businessName: p.businessName }),
  (p) => ({
    adId: p.adId,
    businessId: p.businessId,
    businessName: p.businessName,
    link: '/dashboard/ads',
  })
);
export const publishAdApproved = def<{ userId: string; adId: string; businessName: string }>(
  DomainEventType.AD_APPROVED,
  (p) => ({ adId: p.adId, businessName: p.businessName }),
  (p) => ({ adId: p.adId, businessName: p.businessName, link: '/dashboard/ads' })
);
export const publishAdRejected = def<{
  userId: string;
  adId: string;
  businessName: string;
  reason: string;
}>(
  DomainEventType.AD_REJECTED,
  (p) => ({ adId: p.adId, businessName: p.businessName, reason: p.reason }),
  (p) => ({ adId: p.adId, businessName: p.businessName, reason: p.reason, link: '/dashboard/ads' })
);
export const publishAdCompleted = def<{ userId: string; adId: string; businessName: string }>(
  DomainEventType.AD_COMPLETED,
  (p) => ({ adId: p.adId, businessName: p.businessName }),
  (p) => ({ adId: p.adId, businessName: p.businessName, link: '/dashboard/ads' })
);
export const publishReviewPublished = def<{
  userId: string;
  businessId: string;
  businessName: string;
  rating: number;
}>(
  DomainEventType.REVIEW_PUBLISHED,
  (p) => ({ businessId: p.businessId, businessName: p.businessName, rating: p.rating }),
  (p) => ({ businessId: p.businessId, businessName: p.businessName, link: '/dashboard/reviews' })
);
export const publishReviewResponse = def<{
  userId: string;
  businessId: string;
  businessName: string;
}>(
  DomainEventType.REVIEW_RESPONSE,
  (p) => ({ businessId: p.businessId, businessName: p.businessName }),
  (p) => ({ businessId: p.businessId, businessName: p.businessName, link: '/dashboard/reviews' })
);

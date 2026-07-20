// Re-export all business/commerce types from shared package (single source of truth)
export type {
  BusinessType,
  BusinessModule,
  BusinessSettings,
  BusinessHour,
  Business,
  BusinessStats,
  BusinessClient,
  BusinessReview,
  OnboardingPaymentMethod,
  OnboardingData,
  PaymentMethod,
  DeliveryZone,
} from '@afribiz/shared';

export type {
  Product,
  ProductVariant,
  Service,
  MenuCategory,
  MenuItemVariant,
  MenuItem,
  Room,
  BusinessEvent,
  Rental,
  Promotion,
  PortfolioItem,
  Partner,
} from '@afribiz/shared';

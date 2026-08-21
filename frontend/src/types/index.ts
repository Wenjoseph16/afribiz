// Core types shared between frontend and backend
export type {
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  PaginatedResponseWrapper,
  ApiError,
  ApiVersion,
} from '@afribiz/shared';

export type {
  User,
  UserRole,
  TwoFactorMethod,
  UserProfile,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  RefreshRequest,
  TwoFactorSetup,
  TwoFactorVerify,
  TwoFactorChallenge,
  PasswordResetRequest,
  PasswordResetConfirm,
  AuthPayload,
} from '@afribiz/shared';

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
  CartItem,
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
  CheckoutRequest,
  Product,
  ProductVariant,
  Service,
  MenuItemVariant,
  MenuItem,
  MenuCategory,
  Room,
  BusinessEvent,
  Rental,
  Promotion,
  PortfolioItem,
  Partner,
  Referral,
  ReferralReward,
  ReferralCodeResponse,
} from '@afribiz/shared';

export type {
  Notification,
  NotificationPreference,
  NotificationTemplate,
  SendNotificationRequest,
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
} from '@afribiz/shared';

export type {
  Notification as Notif,
  NotificationPreference as NotifPreference,
  NotificationTemplate as NotifTemplate,
  SendNotificationRequest as SendNotifRequest,
} from '@afribiz/shared';

// Frontend-specific types (not yet in shared)
export * from './orders';
export * from './developer';
export * from './ads';
export * from './transactions';

// ============================================
// React Query hooks param types (replace `any` usage)
// ============================================

import type { ApiPaginationParams } from '@afribiz/shared';

/** Base query params for list endpoints */
export type QueryParams = ApiPaginationParams & {
  search?: string;
  status?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
};

// Product types
export interface CreateProductData {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  currency?: string;
  comparePrice?: number;
  costPrice?: number;
  stock?: number;
  sku?: string;
  images?: string[];
  tags?: string[];
  categoryId?: string;
  isActive?: boolean;
  [key: string]: unknown;
}
export type UpdateProductData = Partial<CreateProductData>;

// Service types
export interface CreateServiceData {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration?: number;
  images?: string[];
  isActive?: boolean;
  [key: string]: unknown;
}
export type UpdateServiceData = Partial<CreateServiceData>;

// Menu types
export interface CreateMenuItemData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  categoryId?: string;
  images?: string[];
  isActive?: boolean;
  [key: string]: unknown;
}
export type UpdateMenuItemData = Partial<CreateMenuItemData>;

// Menu category types
export interface CreateMenuCategoryData {
  name: string;
  description?: string;
  parentId?: string | null;
  [key: string]: unknown;
}
export type UpdateMenuCategoryData = Partial<CreateMenuCategoryData>;

// Room types
export interface CreateRoomData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  capacity?: number;
  images?: string[];
  isActive?: boolean;
  [key: string]: unknown;
}
export type UpdateRoomData = Partial<CreateRoomData>;

// Event types
export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  price?: number;
  capacity?: number;
  [key: string]: unknown;
}
export type UpdateEventData = Partial<CreateEventData>;

// Employee types
export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}
export type UpdateEmployeeData = Partial<CreateEmployeeData>;

// Promotion types
export interface CreatePromotionData {
  title: string;
  description?: string;
  /** Alias historique — le backend attend `promotionType` (PERCENTAGE | FIXED | …) */
  discountType?: string;
  promotionType?: string;
  discountValue: number;
  startsAt?: string;
  endsAt?: string;
  [key: string]: unknown;
}
export type UpdatePromotionData = Partial<CreatePromotionData>;

// Planning task types
export interface CreatePlanningTaskData {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: string;
  [key: string]: unknown;
}
export type UpdatePlanningTaskData = Partial<CreatePlanningTaskData>;

// Expense types
export interface CreateExpenseData {
  description: string;
  amount: number;
  category?: string;
  date?: string;
  notes?: string;
  [key: string]: unknown;
}
export type UpdateExpenseData = Partial<CreateExpenseData>;

// Delivery types
export interface CreateDeliveryData {
  address: string;
  contactName: string;
  contactPhone: string;
  [key: string]: unknown;
}
export type UpdateDeliveryData = Partial<CreateDeliveryData>;

// Portfolio types
export interface CreatePortfolioItemData {
  title: string;
  description?: string;
  images?: string[];
  categoryId?: string;
  [key: string]: unknown;
}
export type UpdatePortfolioItemData = Partial<CreatePortfolioItemData>;

// Document types
export interface CreateDocumentData {
  title: string;
  description?: string;
  category?: string;
  [key: string]: unknown;
}
export type UpdateDocumentData = Partial<CreateDocumentData>;

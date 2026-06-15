// Shared type definitions for both frontend and backend
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'CLIENT' | 'BUSINESS' | 'DEVELOPER' | 'ADMIN';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== CART TYPES =====
export interface CartItem {
  id: string;
  cartId: string;
  productId?: string;
  variantId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string;
  notes?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    stock: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  couponId?: string;
  notes?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId?: string;
  variantId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  notes?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
  notes?: string;
}

export interface CheckoutRequest {
  type: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
  paymentMethod: string;
  couponCode?: string;
}

// ===== REFERRAL TYPES =====
export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  code: string;
  status: 'PENDING' | 'CONVERTED' | 'EXPIRED';
  rewardAwarded: boolean;
  convertedAt?: string;
  createdAt: string;
  referee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface ReferralReward {
  id: string;
  referralId: string;
  userId: string;
  type: 'POINTS' | 'DISCOUNT' | 'CASH' | 'BONUS';
  amount: number;
  currency: string;
  points?: number;
  status: 'PENDING' | 'AWARDED' | 'EXPIRED';
  awardedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ReferralCodeResponse {
  code: string;
  shareUrl: string;
  totalReferrals: number;
  totalRewards: number;
  rewards: ReferralReward[];
}

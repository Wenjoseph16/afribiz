// ===== Cart =====
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

// ===== Product =====
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  brand: string | null;
  price: number;
  currency: string;
  comparePrice: number | null;
  costPrice: number | null;
  images: string[];
  video: string | null;
  tags: string[];
  stock: number;
  lowStockThreshold: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  weightUnit: string | null;
  unit: string | null;
  dimensions: string | null;
  deliveryFee: number | null;
  isActive: boolean;
  isPhysical: boolean;
  hasVariants: boolean;
  isPromotional: boolean;
  promotionalPrice: number | null;
  discountPercent: number | null;
  isOnPreOrder: boolean;
  isVisibleOnPublicPage: boolean;
  isVisibleOnMarketplace: boolean;
  featured: boolean;
  sortOrder: number;
  rating: number;
  reviewCount: number;
  orderCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { id: string; name: string; slug: string } | null;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  isActive: boolean;
}

// ===== Service =====
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration: number | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

// ===== Menu =====
export interface MenuItemVariant {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  shortDescription?: string | null;
  description: string | null;
  price: number;
  promotionalPrice?: number;
  currency: string;
  images: string[];
  video?: string;
  tags?: string[];
  isAvailable: boolean;
  isActive?: boolean;
  isPopular?: boolean;
  isStar?: boolean;
  isPromotional?: boolean;
  discountPercent?: number;
  featured?: boolean;
  sortOrder: number;
  type?: string;
  status?: string;
  category?: { id: string; name: string } | null;
  prepTime?: number;
  cookTime?: number;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  hasVariants?: boolean;
  variants?: MenuItemVariant[];
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  createdAt?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  icon?: string;
  image?: string;
  parentId?: string | null;
  children?: MenuCategory[];
  sortOrder: number;
  items: MenuItem[];
}

// ===== Room =====
export interface Room {
  id: string;
  name: string;
  roomNumber?: string;
  type?: string;
  shortDescription?: string | null;
  description: string | null;
  price: number;
  priceWeekend?: number;
  priceHighSeason?: number;
  priceLowSeason?: number;
  currency: string;
  capacity: number;
  adults?: number;
  children?: number;
  beds?: number;
  size?: number;
  bathroom?: string;
  images: string[];
  video?: string;
  amenities: string[];
  isAvailable: boolean;
  status?: string;
  isActive?: boolean;
  featured?: boolean;
  isPromotional?: boolean;
  promotionalPrice?: number;
  checkInTime?: string;
  checkOutTime?: string;
  quantity: number;
  breakfastIncluded?: boolean;
  rating?: number;
  reviewCount?: number;
  bookingCount?: number;
  createdAt?: string;
}

// ===== Event =====
export interface BusinessEvent {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  price: number | null;
  currency: string;
  images: string[];
  capacity: number | null;
  isActive: boolean;
}

// ===== Rental =====
export interface Rental {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  unit: string;
  images: string[];
  quantity: number;
  deposit: number | null;
  isAvailable: boolean;
  weeklyPrice?: number;
  conditions?: string;
}

// ===== Promotion =====
export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  code: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  image: string | null;
}

// ===== Portfolio =====
export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  url: string | null;
  category: string | null;
  date: string | null;
}

// ===== Partner =====
export interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  isActive: boolean;
}

// ===== Booking =====
export interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate?: string;
  total: number;
  currency: string;
  createdAt: string;
}

// ===== Referral =====
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

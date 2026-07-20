export interface OfferFlash {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  image?: string;
  discountPercent: number;
  originalPrice?: number;
  flashPrice?: number;
  currency: string;
  quantity: number;
  soldCount: number;
  maxPerCustomer?: number;
  terms?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  isFeatured: boolean;
  business?: { id: string; name: string; slug: string; logo?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferFlashRequest {
  title: string;
  description?: string;
  image?: string;
  discountPercent: number;
  originalPrice?: number;
  flashPrice?: number;
  currency?: string;
  quantity: number;
  maxPerCustomer?: number;
  terms?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  startAt: string;
  endAt: string;
  isFeatured?: boolean;
}

export interface UpdateOfferFlashRequest {
  title?: string;
  description?: string;
  image?: string;
  discountPercent?: number;
  originalPrice?: number;
  flashPrice?: number;
  quantity?: number;
  maxPerCustomer?: number;
  terms?: string;
  radiusKm?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface NearbyBusiness {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  type: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  activeOffers: number;
  rating?: number;
  totalRatings: number;
  isOpen: boolean;
}

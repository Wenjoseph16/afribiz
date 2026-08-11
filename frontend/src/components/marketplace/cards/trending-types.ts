export interface TrendingBusiness {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  city: string;
  type?: string;
  category?: string;
  logo?: string;
  slug?: string;
}

export interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  businessSlug: string;
  businessId?: string;
}

export interface TrendingService {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  businessName: string;
  businessSlug?: string;
}

export interface TrendingEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  availableSeats: number;
  organizer: string;
}

export interface TrendingModule {
  id: string;
  name: string;
  price: number;
  rating: number;
  installCount: number;
  developer: string;
  slug?: string;
  url?: string;
}

export interface TrendingData {
  topBusinesses?: TrendingBusiness[];
  topProducts?: TrendingProduct[];
  topServices?: TrendingService[];
  topEvents?: TrendingEvent[];
  topRooms?: TrendingProduct[];
  topTrainings?: TrendingProduct[];
  topModules?: TrendingModule[];
}

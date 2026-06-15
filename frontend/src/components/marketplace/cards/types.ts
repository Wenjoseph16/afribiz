export type ResultType = 'business' | 'product' | 'service' | 'menu' | 'event' | 'rental' | 'developer' | 'module';

export interface BaseResult {
  id: string;
  type: ResultType;
  name: string;
  rating: number;
  reviewCount: number;
  city: string;
  country?: string;
  image?: string;
  distance?: string;
  businessSlug?: string;
}

export interface BusinessResult extends BaseResult {
  type: 'business';
  slug?: string;
  logo?: string;
  category: string;
  description: string;
  badges: string[];
  modules: string[];
}

export interface ProductResult extends BaseResult {
  type: 'product';
  price: number;
  promoPrice?: number;
  businessName: string;
  businessId?: string;
  businessSlug: string;
  available: boolean;
  image: string;
  description?: string;
}

export interface ServiceResult extends BaseResult {
  type: 'service';
  price: number;
  duration: string;
  businessName: string;
  image: string;
}

export interface MenuResult extends BaseResult {
  type: 'menu';
  price: number;
  restaurant: string;
  available: boolean;
  image: string;
}

export interface EventResult extends BaseResult {
  type: 'event';
  date: string;
  price: number;
  city: string;
  availableSeats: number;
  organizer: string;
  image: string;
}

export interface RentalResult extends BaseResult {
  type: 'rental';
  dailyRate: number;
  weeklyRate: number;
  deposit: number;
  available: boolean;
  image: string;
}

export interface DeveloperResult extends BaseResult {
  type: 'developer';
  photo?: string;
  company: string;
  specialties: string[];
  moduleCount: number;
}

export interface ModuleResult extends BaseResult {
  type: 'module';
  logo?: string;
  developer: string;
  version: string;
  price: number;
  installCount: number;
}

export type ResultItem =
  | BusinessResult
  | ProductResult
  | ServiceResult
  | MenuResult
  | EventResult
  | RentalResult
  | DeveloperResult
  | ModuleResult;

export interface ResultCardProps {
  item: ResultItem;
  view?: 'grid' | 'list';
}

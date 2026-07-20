export interface MarketplaceSearchParams {
  q?: string;
  phrases?: string[];
  excluded?: string[];
  cursor?: string;
  type?: string;
  category?: string;
  country?: string;
  city?: string;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  priceRange?: string;
  verified?: boolean;
  premium?: boolean;
  openNow?: boolean;
  delivery?: boolean;
  reservation?: boolean;
  proximity?: string;
  lat?: string;
  lng?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: string[];
}

export interface MarketplaceResult {
  id: string;
  _type: string;
  name?: string;
  [key: string]: any;
}

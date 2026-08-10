export type AdvertiserType = 'BUSINESS' | 'DEVELOPER' | 'EXTERNAL';
export type AdStatus =
  | 'PENDING'
  | 'VALIDATED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'SUSPENDED';
export type AdPlacementPage =
  | 'HOMEPAGE'
  | 'MARKETPLACE'
  | 'DASHBOARD_CLIENT'
  | 'DASHBOARD_BUSINESS'
  | 'DASHBOARD_DEVELOPER'
  | 'MODULE_PAGE'
  | 'EVENT_PAGE'
  | 'PRODUCT_PAGE'
  | 'NOTIFICATION_CENTER'
  | 'BUSINESS_PUBLIC_PAGE'
  | 'ABOUT'
  | 'PRICING'
  | 'CONTACT'
  | 'DEVELOPERS'
  | 'BLOG'
  | 'MEDIA'
  | 'BLOG_ARTICLE'
  | 'LEGAL'
  | 'FEED';
export type AdPlacementPosition =
  | 'HERO_BANNER'
  | 'TOP_BANNER'
  | 'BOTTOM_BANNER'
  | 'SIDEBAR'
  | 'SPONSORED_CARD'
  | 'SPONSORED_RESULT'
  | 'CAROUSEL'
  | 'FEATURED_BLOCK'
  | 'PROMO_WIDGET'
  | 'RECOMMENDED'
  | 'POPUP';
export type AdFormat =
  | 'BANNER_HORIZONTAL'
  | 'BANNER_VERTICAL'
  | 'SPONSORED_CARD'
  | 'CAROUSEL'
  | 'WIDGET'
  | 'VIDEO'
  | 'POPUP'
  | 'NOTIFICATION';
export type AdObjective =
  | 'BRAND_AWARENESS'
  | 'TRAFFIC'
  | 'LEADS'
  | 'SALES'
  | 'INSTALLS'
  | 'PROMOTION';

export interface AdPackage {
  id: string;
  name: string;
  slug: string;
  description?: string;
  advertiserType: AdvertiserType;
  placements: string[];
  durationHours: number;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdCampaign {
  id: string;
  packageId?: string;
  package?: AdPackage;
  advertiserType: AdvertiserType;
  businessId?: string;
  business?: { id: string; name: string; slug: string; logo?: string };
  developerId?: string;
  companyName?: string;
  responsibleName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  country?: string;
  city?: string;
  name: string;
  objective: AdObjective;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  geoTarget: string[];
  status: AdStatus;
  validatedAt?: string;
  validatedBy?: string;
  rejectionReason?: string;
  activatedAt?: string;
  completedAt?: string;
  suspendedAt?: string;
  suspendReason?: string;
  creatives?: AdCreative[];
  invoice?: AdInvoice;
  createdAt: string;
  updatedAt: string;
}

export interface AdCreative {
  id: string;
  campaignId: string;
  placementPage: AdPlacementPage;
  placementPosition: AdPlacementPosition;
  format: AdFormat;
  mainImage?: string;
  secondaryImages: string[];
  banner?: string;
  video?: string;
  logo?: string;
  adText?: string;
  destinationUrl?: string;
  cta?: string;
  ctaColor?: string;
  targetCountries: string[];
  targetCities: string[];
  minRating?: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  isActive: boolean;
  sortOrder: number;
  campaign?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdImpression {
  id: string;
  campaignId: string;
  creativeId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  page: string;
  position: string;
  referrer?: string;
  sessionId?: string;
  cost: number;
  createdAt: string;
}

export interface AdClick {
  id: string;
  campaignId: string;
  impressionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  page: string;
  position: string;
  cost: number;
  createdAt: string;
}

export interface AdConversion {
  id: string;
  campaignId: string;
  clickId?: string;
  type: string;
  value?: number;
  reference?: string;
  userId?: string;
  createdAt: string;
}

export interface AdInvoice {
  id: string;
  campaignId: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: string;
  paidAt?: string;
  dueAt?: string;
  paymentMethod?: string;
  paymentRef?: string;
  lineItems?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  averageCTR: number;
  averageCPC: number;
  averageCPM: number;
}

export interface CreateCampaignRequest {
  packageId?: string;
  companyName?: string;
  responsibleName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  country?: string;
  city?: string;
  name: string;
  objective: AdObjective;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  geoTarget?: string[];
  creatives: Array<{
    placementPage: AdPlacementPage;
    placementPosition: AdPlacementPosition;
    format: AdFormat;
    mainImage?: string;
    secondaryImages?: string[];
    banner?: string;
    video?: string;
    logo?: string;
    adText?: string;
    destinationUrl?: string;
    cta?: string;
    targetCountries?: string[];
    targetCities?: string[];
  }>;
}

export interface TrackImpressionRequest {
  creativeId: string;
  campaignId: string;
  page: string;
  position: string;
}

export interface TrackClickRequest {
  creativeId: string;
  campaignId: string;
  page: string;
  position: string;
}

export interface AdReportRequest {
  campaignId: string;
  reason: string;
}

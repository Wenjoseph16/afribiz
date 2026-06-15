export type AdvertiserType = 'BUSINESS' | 'DEVELOPER' | 'EXTERNAL';
export type AdStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
export type AdPlacementPage = 'HOMEPAGE' | 'MARKETPLACE' | 'DASHBOARD_CLIENT' | 'DASHBOARD_BUSINESS' | 'DASHBOARD_DEVELOPER' | 'MODULE_PAGE' | 'EVENT_PAGE' | 'NOTIFICATION_CENTER' | 'BUSINESS_PUBLIC_PAGE';
export type AdPlacementPosition = 'HERO_BANNER' | 'TOP_BANNER' | 'BOTTOM_BANNER' | 'SIDEBAR' | 'SPONSORED_CARD' | 'SPONSORED_RESULT' | 'CAROUSEL' | 'FEATURED_BLOCK' | 'PROMO_WIDGET' | 'RECOMMENDED' | 'POPUP';
export type AdFormat = 'BANNER_HORIZONTAL' | 'BANNER_VERTICAL' | 'SPONSORED_CARD' | 'CAROUSEL' | 'WIDGET' | 'VIDEO' | 'POPUP' | 'NOTIFICATION';
export type AdObjective = 'BRAND_AWARENESS' | 'TRAFFIC' | 'LEADS' | 'SALES' | 'INSTALLS' | 'PROMOTION';

export interface AdCreative {
  id: string;
  campaignId: string;
  placementPage: AdPlacementPage;
  placementPosition: AdPlacementPosition;
  format: AdFormat;
  mainImage: string | null;
  secondaryImages: string[];
  banner: string | null;
  video: string | null;
  logo: string | null;
  adText: string | null;
  destinationUrl: string | null;
  cta: string | null;
  ctaColor: string | null;
  targetCountries: string[];
  targetCities: string[];
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  sortOrder: number;
}

export interface AdCampaign {
  id: string;
  packageId: string | null;
  advertiserType: AdvertiserType;
  businessId: string | null;
  developerId: string | null;
  companyName: string | null;
  responsibleName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  name: string;
  objective: AdObjective;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: number | null;
  geoTarget: string[];
  status: AdStatus;
  validatedAt: string | null;
  validatedBy: string | null;
  rejectionReason: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  suspendedAt: string | null;
  suspendReason: string | null;
  creatives: AdCreative[];
  invoice?: AdInvoice;
  _count?: { impressions: number; clicks: number; conversions: number };
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
  paidAt: string | null;
  dueAt: string | null;
  paymentMethod: string | null;
  paymentRef: string | null;
  lineItems: any;
}

export interface AdPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  advertiserType: AdvertiserType;
  placements: string[];
  durationHours: number;
  price: number;
  currency: string;
  isActive: boolean;
}

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  PENDING: 'En attente', VALIDATED: 'Validée', REJECTED: 'Refusée',
  SCHEDULED: 'Programmée', ACTIVE: 'Active', COMPLETED: 'Terminée', SUSPENDED: 'Suspendue',
};

export const AD_STATUS_STYLES: Record<AdStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VALIDATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SCHEDULED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  SUSPENDED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const AD_OBJECTIVE_LABELS: Record<AdObjective, string> = {
  BRAND_AWARENESS: 'Notoriété', TRAFFIC: 'Trafic', LEADS: 'Leads',
  SALES: 'Ventes', INSTALLS: 'Installations', PROMOTION: 'Promotion',
};

export const AD_PLACEMENT_PAGE_LABELS: Record<AdPlacementPage, string> = {
  HOMEPAGE: 'Page d\'accueil', MARKETPLACE: 'Marketplace',
  DASHBOARD_CLIENT: 'Dashboard client', DASHBOARD_BUSINESS: 'Dashboard business',
  DASHBOARD_DEVELOPER: 'Dashboard développeur', MODULE_PAGE: 'Page module',
  EVENT_PAGE: 'Page événement', NOTIFICATION_CENTER: 'Centre notifications',
  BUSINESS_PUBLIC_PAGE: 'Page publique business',
};

export const AD_FORMAT_LABELS: Record<AdFormat, string> = {
  BANNER_HORIZONTAL: 'Bannière horizontale', BANNER_VERTICAL: 'Bannière verticale',
  SPONSORED_CARD: 'Carte sponsorisée', CAROUSEL: 'Carrousel',
  WIDGET: 'Widget', VIDEO: 'Vidéo', POPUP: 'Popup', NOTIFICATION: 'Notification',
};

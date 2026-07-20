// Re-export ad types from shared package (single source of truth)
export type {
  AdvertiserType,
  AdStatus,
  AdPlacementPage,
  AdPlacementPosition,
  AdFormat,
  AdObjective,
  AdPackage,
  AdCampaign,
  AdCreative,
  AdImpression,
  AdClick,
  AdConversion,
  AdInvoice,
  AdStats,
  CreateCampaignRequest,
  TrackImpressionRequest,
  TrackClickRequest,
  AdReportRequest,
} from '@afribiz/shared';

// Import for local use (label/style records below)
import type { AdStatus, AdObjective, AdPlacementPage, AdFormat } from '@afribiz/shared';

// UI-specific label/style records (frontend-only)
export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validée',
  REJECTED: 'Refusée',
  SCHEDULED: 'Programmée',
  ACTIVE: 'Active',
  PAUSED: 'En pause',
  COMPLETED: 'Terminée',
  SUSPENDED: 'Suspendue',
};

export const AD_STATUS_STYLES: Record<AdStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VALIDATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SCHEDULED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  SUSPENDED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const AD_OBJECTIVE_LABELS: Record<AdObjective, string> = {
  BRAND_AWARENESS: 'Notoriété',
  TRAFFIC: 'Trafic',
  LEADS: 'Leads',
  SALES: 'Ventes',
  INSTALLS: 'Installations',
  PROMOTION: 'Promotion',
};

export const AD_PLACEMENT_PAGE_LABELS: Record<AdPlacementPage, string> = {
  HOMEPAGE: "Page d'accueil",
  MARKETPLACE: 'Marketplace',
  DASHBOARD_CLIENT: 'Dashboard client',
  DASHBOARD_BUSINESS: 'Dashboard business',
  DASHBOARD_DEVELOPER: 'Dashboard développeur',
  MODULE_PAGE: 'Page module',
  EVENT_PAGE: 'Page événement',
  NOTIFICATION_CENTER: 'Centre notifications',
  BUSINESS_PUBLIC_PAGE: 'Page publique business',
};

export const AD_FORMAT_LABELS: Record<AdFormat, string> = {
  BANNER_HORIZONTAL: 'Bannière horizontale',
  BANNER_VERTICAL: 'Bannière verticale',
  SPONSORED_CARD: 'Carte sponsorisée',
  CAROUSEL: 'Carrousel',
  WIDGET: 'Widget',
  VIDEO: 'Vidéo',
  POPUP: 'Popup',
  NOTIFICATION: 'Notification',
};

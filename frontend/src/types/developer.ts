// Import types locally for constants, re-export for consumers
import type { ModulePricingType, DeveloperTier, ModuleStatus } from '@afribiz/shared';

// Re-export developer types from shared package (single source of truth)
export type {
  DeveloperTier,
  DeveloperVerificationStatus,
  ModulePricingType,
  ModuleStatus,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  PayoutStatus,
  RevenueType,
  ModulePermissionAccess,
  ModulePermissionResource,
  LicenseType,
  LicenseStatus,
  WebhookEventType,
  WebhookDeliveryStatus,
  ModuleSubscriptionStatus,
  DeveloperProfile,
  DeveloperModule,
  DeveloperModuleVersion,
  DeveloperModuleReview,
  DeveloperModuleInstallation,
  DeveloperSupportTicket,
  DeveloperSupportMessage,
  DeveloperRevenue,
  DeveloperPayout,
  DeveloperDashboardData,
  ModulePermission,
  ModuleLicense,
  DeveloperApiKey,
  ModuleWebhook,
  WebhookDelivery,
  ModuleAnalytics,
  ModuleErrorLog,
  ValidationCheck,
  ModuleValidation,
  ModuleSubscription,
  ModuleConfiguration,
  ModuleActivityLog,
  PermissionCheckResult,
  PermissionSummary,
  LicenseCheckResult,
  LicenseStats,
  ModuleAnalyticsData,
  DeveloperAnalyticsOverview,
  ActivityStats,
} from '@afribiz/shared';

// ============================================
// UI-SPECIFIC CONSTANTS (frontend-only, not in shared)
// ============================================

export const MODULE_CATEGORIES = [
  'Commerce',
  'Paiement',
  'Marketing',
  'Réservation',
  'Livraison',
  'Comptabilité',
  'Finance',
  'CRM',
  'RH',
  'Immobilier',
  'Location',
  'Formation',
  'Événementiel',
  'Productivité',
  'Communication',
  'Automatisation',
  'Rapports',
  'Sécurité',
  'Intelligence métier',
  'Outils avancés',
] as const;

export const PRICING_LABELS: Record<ModulePricingType, string> = {
  FREE: 'Gratuit',
  ONE_TIME: 'Paiement unique',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  SEMESTRIAL: 'Semestriel',
  YEARLY: 'Annuel',
  CUSTOM: 'Personnalisé',
};

export const TIER_LABELS: Record<DeveloperTier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
};

export const MODULE_STATUS_LABELS: Record<ModuleStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En révision',
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
};

// ============================================
// ONBOARDING DÉVELOPPEUR (wizard premium)
// ============================================

import type { MasteryLevel } from '@/constants/developer';

export interface CoreStackItem {
  name: string;
  level: MasteryLevel;
  years?: number;
}

export interface DevPortfolioItem {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
}

export interface DevCertification {
  name: string;
  issuer?: string;
  year?: number;
  fileUrl?: string;
}

export interface DevExpertise {
  coreStack: CoreStackItem[];
  domains: string[];
}

export interface DevOnboardingData {
  // Identité
  photo: string;
  companyLogo: string;
  companyName: string;
  bio: string;
  phone: string;
  professionalEmail: string;
  country: string;
  city: string;
  // Expertise
  yearsOfExperience: number | null;
  expertise: DevExpertise;
  github: string;
  gitlab: string;
  linkedin: string;
  website: string;
  portfolioUrl: string;
  // Preuves
  portfolioItems: DevPortfolioItem[];
  certifications: DevCertification[];
}

export function emptyDevOnboardingData(): DevOnboardingData {
  return {
    photo: '',
    companyLogo: '',
    companyName: '',
    bio: '',
    phone: '',
    professionalEmail: '',
    country: '',
    city: '',
    yearsOfExperience: null,
    expertise: { coreStack: [], domains: [] },
    github: '',
    gitlab: '',
    linkedin: '',
    website: '',
    portfolioUrl: '',
    portfolioItems: [],
    certifications: [],
  };
}

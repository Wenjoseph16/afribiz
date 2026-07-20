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

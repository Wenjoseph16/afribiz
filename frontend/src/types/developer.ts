export type DeveloperTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type DeveloperVerificationStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export type ModulePricingType = 'FREE' | 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'SEMESTRIAL' | 'YEARLY' | 'CUSTOM';

export type ModuleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'BUG' | 'FEATURE' | 'QUESTION' | 'OTHER';

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type RevenueType = 'SALE' | 'SUBSCRIPTION' | 'UPGRADE' | 'COMMISSION';

export const MODULE_CATEGORIES = [
  'Commerce', 'Paiement', 'Marketing', 'Réservation', 'Livraison',
  'Comptabilité', 'Finance', 'CRM', 'RH', 'Immobilier', 'Location',
  'Formation', 'Événementiel', 'Productivité', 'Communication',
  'Automatisation', 'Rapports', 'Sécurité', 'Intelligence métier', 'Outils avancés',
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

export interface DeveloperProfile {
  id: string;
  userId: string;

  developerName: string | null;
  companyName: string | null;
  photo: string | null;
  companyLogo: string | null;
  phone: string | null;
  whatsapp: string | null;
  professionalEmail: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  github: string | null;
  gitlab: string | null;
  portfolio: string | null;
  linkedin: string | null;

  yearsOfExperience: number | null;
  specialties: string[];
  technologies: string[];
  presentation: string | null;
  publicDescription: string | null;

  verificationStatus: DeveloperVerificationStatus;
  identityDocument: string | null;
  companyDocument: string | null;
  responsiblePhoto: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;

  tier: DeveloperTier;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalRevenue: number;
  totalModules: number;
  publishedModules: number;

  apiKey: string | null;
  webhookUrl: string | null;
  onboardingCompleted: boolean;
  onboardingStep: number;

  createdAt: string;
  updatedAt: string;
}

export interface DeveloperModule {
  id: string;
  developerId: string;
  developer?: DeveloperProfile;

  name: string;
  slug: string;
  version: string;
  category: string;
  subcategory: string | null;
  shortDescription: string;
  fullDescription: string | null;
  logo: string | null;
  images: string[];
  demoVideo: string | null;
  documentation: string | null;
  installationGuide: string | null;

  pricingType: ModulePricingType;
  price: number | null;
  currency: string;
  hasFreeVersion: boolean;
  hasPremiumVersion: boolean;
  freeVersionFeatures: string[];
  premiumVersionFeatures: string[];
  customPricingUrl: string | null;

  termsOfUse: string | null;
  supportPolicy: string | null;
  licenseType: string | null;

  status: ModuleStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  rejectionReason: string | null;

  totalInstalls: number;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  requires: string[];

  createdAt: string;
  updatedAt: string;
}

export interface DeveloperModuleVersion {
  id: string;
  moduleId: string;
  version: string;
  releaseNotes: string | null;
  changelog: string | null;
  documentationUrl: string | null;
  installScript: string | null;
  uninstallScript: string | null;
  minAppVersion: string | null;
  isBreaking: boolean;
  isDeprecated: boolean;
  deprecationMessage: string | null;
  downloadUrl: string | null;
  fileSize: number | null;
  checksum: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface DeveloperModuleReview {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  userId: string;
  user?: { id: string; firstName: string; lastName: string; avatar: string | null };
  developerId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  responseAt: string | null;
  isReported: boolean;
  reportReason: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperModuleInstallation {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  businessId: string;
  business?: { id: string; name: string; slug: string; logo: string | null };
  version: string;
  status: string;
  autoUpdate: boolean;
  installedAt: string | null;
  uninstalledAt: string | null;
  uninstallReason: string | null;
  createdAt: string;
}

export interface DeveloperSupportTicket {
  id: string;
  moduleId: string | null;
  module?: DeveloperModule;
  developerId: string;
  businessId: string | null;
  business?: { id: string; name: string; slug: string } | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  messages?: DeveloperSupportMessage[];
}

export interface DeveloperSupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  sender?: { id: string; firstName: string; lastName: string; avatar: string | null };
  content: string;
  attachment: string | null;
  createdAt: string;
}

export interface DeveloperRevenue {
  id: string;
  developerId: string;
  moduleId: string | null;
  module?: DeveloperModule;
  type: RevenueType;
  amount: number;
  currency: string;
  commissionAmount: number;
  netAmount: number;
  commissionRate: number;
  reference: string | null;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface DeveloperPayout {
  id: string;
  developerId: string;
  amount: number;
  currency: string;
  commissionAmount: number;
  netAmount: number;
  commissionRate: number;
  method: string;
  reference: string | null;
  status: PayoutStatus;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DeveloperDashboardData {
  profile: DeveloperProfile;
  modules: {
    total: number;
    published: number;
    draft: number;
    pending: number;
    totalInstalls: number;
    totalSales: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    pending: number;
    netTotal: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    recent: DeveloperModuleReview[];
  };
  tickets: {
    open: number;
    total: number;
  };
  recentInstallations: DeveloperModuleInstallation[];
}

// ============================================
// EXTENDED DEVELOPER TYPES (Permissions, Licenses, API, etc.)
// ============================================

export type ModulePermissionAccess = 'READ' | 'WRITE' | 'ADMIN';
export type ModulePermissionResource =
  | 'PRODUCTS' | 'SERVICES' | 'BOOKINGS' | 'ORDERS' | 'CLIENTS'
  | 'CRM' | 'MARKETING' | 'PAYMENTS' | 'ACCOUNTING' | 'EMPLOYEES'
  | 'DELIVERIES' | 'EVENTS' | 'TRAININGS' | 'RENTALS' | 'SETTINGS'
  | 'DATA_EXPORT';

export type LicenseType = 'FREE' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'TRIAL';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED' | 'PENDING';

export type WebhookEventType =
  | 'MODULE_SUBMITTED' | 'MODULE_APPROVED' | 'MODULE_REJECTED'
  | 'MODULE_INSTALLED' | 'MODULE_UNINSTALLED' | 'MODULE_SOLD'
  | 'MODULE_REVIEWED' | 'MODULE_UPDATED' | 'MODULE_LICENSE_EXPIRING'
  | 'MODULE_LICENSE_EXPIRED' | 'MODULE_ERROR' | 'PAYOUT_REQUESTED'
  | 'PAYOUT_COMPLETED' | 'TICKET_CREATED' | 'TICKET_RESOLVED';

export type WebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING';
export type ModuleSubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
export type ModuleActivityType = string;

export interface ModulePermission {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  resource: ModulePermissionResource;
  accessLevel: ModulePermissionAccess;
  description: string | null;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleLicense {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  businessId: string;
  business?: { id: string; name: string; slug: string; logo: string | null };
  licenseType: LicenseType;
  status: LicenseStatus;
  licenseKey: string;
  price: number | null;
  currency: string;
  startsAt: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
  maxInstallations: number;
  currentInstallations: number;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperApiKey {
  id: string;
  developerId: string;
  name: string;
  key: string;
  scopes: ModulePermissionResource[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ModuleWebhook {
  id: string;
  developerId: string;
  moduleId: string | null;
  module?: DeveloperModule;
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { deliveries: number };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: WebhookDeliveryStatus;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  attempts: number;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ModuleAnalytics {
  id: string;
  moduleId: string;
  date: string;
  installs: number;
  uninstalls: number;
  activeUsers: number;
  errors: number;
  apiCalls: number;
  avgResponseTime: number | null;
  revenue: number | null;
  refunds: number | null;
  retentionRate: number | null;
  conversionRate: number | null;
}

export interface ModuleErrorLog {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  installationId: string | null;
  businessId: string | null;
  errorType: string;
  errorMessage: string | null;
  stackTrace: string | null;
  metadata: any;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ValidationCheck {
  id: string;
  validationId: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  score: number | null;
  details: string | null;
  passed: boolean | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ModuleValidation {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  versionId: string | null;
  version?: DeveloperModuleVersion;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  score: number | null;
  checks: ValidationCheck[];
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  submittedAt: string;
  createdAt: string;
}

export interface ModuleSubscription {
  id: string;
  licenseId: string;
  license?: ModuleLicense;
  moduleId: string;
  module?: DeveloperModule;
  businessId: string;
  business?: { id: string; name: string; slug: string; logo: string | null };
  status: ModuleSubscriptionStatus;
  billingCycle: string;
  amount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleConfiguration {
  id: string;
  moduleId: string;
  businessId: string;
  installationId: string;
  settings: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; slug: string; logo: string | null };
  installation?: { status: string; createdAt: string };
}

export interface ModuleActivityLog {
  id: string;
  moduleId: string;
  module?: DeveloperModule;
  businessId: string | null;
  business?: { id: string; name: string; slug: string; logo: string | null };
  installationId: string | null;
  activityType: ModuleActivityType;
  description: string | null;
  metadata: any;
  createdAt: string;
}

// ============================================
// RESPONSE WRAPPERS
// ============================================

export interface PermissionCheckResult {
  permissions: ModulePermission[];
  granted: boolean;
  config: ModuleConfiguration | null;
}

export interface PermissionSummary {
  readPermissions: ModulePermission[];
  writePermissions: ModulePermission[];
  adminPermissions: ModulePermission[];
  total: number;
  required: number;
}

export interface LicenseCheckResult {
  valid: boolean;
  license: ModuleLicense | null;
  expiresIn: number | null;
}

export interface LicenseStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  monthlyRevenue: number;
}

export interface ModuleAnalyticsData {
  daily: ModuleAnalytics[];
  totals: {
    totalInstalls: number;
    totalUninstalls: number;
    totalErrors: number;
    totalApiCalls: number;
    totalRevenue: number;
    totalRefunds: number;
    avgResponseTime: number | null;
  };
  retention: number;
}

export interface DeveloperAnalyticsOverview {
  totalModules: number;
  analytics: {
    totalInstalls: number;
    totalUninstalls: number;
    totalErrors: number;
    totalApiCalls: number;
    totalRevenue: number;
    totalRefunds: number;
  };
  unresolvedErrors: number;
  recentErrors: ModuleErrorLog[];
}

export interface ActivityStats {
  total: number;
  byType: { activityType: string; _count: number }[];
  recent: ModuleActivityLog[];
}

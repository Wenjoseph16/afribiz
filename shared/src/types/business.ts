export type BusinessType =
  | 'RESTAURANT'
  | 'FAST_FOOD'
  | 'PATISSERIE'
  | 'BOULANGERIE'
  | 'CAFE'
  | 'BAR'
  | 'HOTEL'
  | 'AUBERGE'
  | 'MAISON_D_HOTES'
  | 'LOCATION_SAISONNIERE'
  | 'BOUTIQUE_VETEMENTS'
  | 'BOUTIQUE_CHAUSSURES'
  | 'BOUTIQUE_COSMETIQUES'
  | 'BOUTIQUE_INFORMATIQUE'
  | 'BOUTIQUE_TELEPHONIQUE'
  | 'BOUTIQUE_ELECTRONIQUE'
  | 'SUPERMARCHE'
  | 'EPICERIE'
  | 'PHARMACIE'
  | 'LIBRAIRIE'
  | 'PAPETERIE'
  | 'SALON_COIFFURE'
  | 'SALON_BEAUTE'
  | 'SPA'
  | 'INSTITUT_ESTHETIQUE'
  | 'PHOTOGRAPHE'
  | 'VIDEOASTE'
  | 'AGENCE_MARKETING'
  | 'AGENCE_COMMUNICATION'
  | 'AGENCE_DIGITALE'
  | 'AGENCE_IMMOBILIERE'
  | 'CABINET_JURIDIQUE'
  | 'CABINET_COMPTABLE'
  | 'CABINET_CONSEIL'
  | 'CABINET_MEDICAL'
  | 'CLINIQUE'
  | 'CENTRE_FORMATION'
  | 'ECOLE_PRIVEE'
  | 'FREELANCE'
  | 'DEVELOPPEUR'
  | 'DESIGNER_GRAPHIQUE'
  | 'CONSULTANT'
  | 'COACH_PROFESSIONNEL'
  | 'ARTISAN'
  | 'MENUISIER'
  | 'MACON'
  | 'PLOMBIER'
  | 'ELECTRICIEN'
  | 'SOUDEUR'
  | 'MECANICIEN'
  | 'ENTREPRISE_AGRICOLE'
  | 'ELEVAGE'
  | 'TRANSPORT'
  | 'LIVRAISON'
  | 'ORGANISATION_EVENEMENTS'
  | 'LOCATION_VEHICULES'
  | 'LOCATION_EQUIPEMENTS'
  | 'LOCATION_ENGINS'
  | 'IMPORT_EXPORT'
  | 'ASSOCIATION'
  | 'ONG'
  | 'ENTREPRISE_PRIVEE'
  | 'AUTRE';

export type VerificationLevel = 'ARGENT' | 'OR' | 'PLATINE';

export type BusinessVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type BusinessModule =
  | 'PRODUCTS'
  | 'SERVICES'
  | 'MENU'
  | 'ROOMS'
  | 'BOOKINGS'
  | 'ORDERS'
  | 'QUOTES_INVOICES'
  | 'DEBTS_PAYMENTS'
  | 'PROMOTIONS'
  | 'PLANNING'
  | 'EMPLOYEES'
  | 'PORTFOLIO'
  | 'SUBSCRIPTIONS'
  | 'DELIVERIES'
  | 'EVENTS'
  | 'RENTALS'
  | 'DOCUMENTS'
  | 'PARTNERS'
  | 'DISPUTES'
  | 'MODULE_MARKETPLACE'
  | 'ADVANCED_TASKS'
  | 'TRAINING';

export interface BusinessSettings {
  id: string;
  businessId: string;
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
  autoConfirmBookings: boolean;
  autoConfirmOrders: boolean;
  allowOnlinePayments: boolean;
  allowCashOnDelivery: boolean;
  notificationEmail: string | null;
  notificationPhone: string | null;
}

export interface BusinessHour {
  id: string;
  day: number;
  open: string | null;
  close: string | null;
  isClosed: boolean;
}

export interface PaymentMethod {
  id: string;
  method: string;
  name: string;
  number?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number | null;
  estimatedTime?: number;
  isActive?: boolean;
}

export interface BusinessTheme {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: 'sm' | 'md' | 'xl' | '2xl';
  fontFamily?: 'inter' | 'geist' | 'system';
  enableAnimations?: boolean;
  layout?: 'standard' | 'compact' | 'elegant';
  sectionVisibility?: Record<string, boolean>;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  type: BusinessType;
  modules: BusinessModule[];
  description: string | null;
  shortDescription: string | null;
  theme?: BusinessTheme | null;
  gallery?: string[];
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  coverImage: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsapp: string | null;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  values: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  googleMapsLink: string | null;
  socialLinks: Record<string, string> | null;
  paymentMethods: PaymentMethod[];
  deliveryZones: DeliveryZone[];
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  tiktok: string | null;
  youtube: string | null;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isVerified: boolean;
  verificationStatus: BusinessVerificationStatus;
  verificationLevel: VerificationLevel;
  managerName: string | null;
  managerBio: string | null;
  experience: number | null;
  skills: string[];
  certifications: string[];
  certificationImages: string[];
  isPremium: boolean;
  isNew: boolean;
  isTopSeller: boolean;
  isTopProvider: boolean;
  isRecommended: boolean;
  onboardingCompleted: boolean;
  onboardedAt: string | null;
  settings: BusinessSettings | null;
  hours: BusinessHour[];
  portfolioImages?: string[];
  setup?: Record<string, { configured: boolean; missing: string[] }>;
  setupComplete?: boolean;
  frozenUntil?: string | null;
  freezeReason?: string | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    yearsOfExperience?: number;
    skills?: string[];
    certifications?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessStats {
  visitors: number;
  clients: number;
  orders: number;
  bookings: number;
  revenue: number;
  paymentsReceived: number;
  paymentsPending: number;
  activeEvents: number;
  publishedProducts: number;
  publishedServices: number;
  activeRentals: number;
  reviewsReceived: number;
  messagesReceived: number;
  conversionRate: number;
  satisfactionRate: number;
}

export interface BusinessClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  totalOrders: number;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  isLoyal: boolean;
  createdAt: string;
}

export interface BusinessReview {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; avatar: string | null };
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  images?: string[];
  createdAt: string;
}

export interface OnboardingPaymentMethod {
  method: string;
  name: string;
  number: string;
  isActive: boolean;
}

export interface OnboardingCertificate {
  name: string;
  issuer: string;
  fileUrl: string;
}

export interface OnboardingPortfolioItem {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

export interface OnboardingOpeningHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

export interface OnboardingData {
  // Step 1 — Identite
  name: string;
  typeId: string;
  description: string;
  logo: string | null;
  banner: string | null;
  // Step 2 — Competences
  competencies: string[];
  experienceDescription: string;
  experienceYears: string;
  certificates: OnboardingCertificate[];
  // Step 3 — Portfolio
  portfolio: OnboardingPortfolioItem[];
  // Step 4 — Localisation
  country: string;
  region: string;
  city: string;
  quarter: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string | null;
  openingHours: OnboardingOpeningHours;
  // Step 5 — Modules
  modules: string[];
}

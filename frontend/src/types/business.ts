export type BusinessType =
  | 'RESTAURANT' | 'FAST_FOOD' | 'PATISSERIE' | 'BOULANGERIE'
  | 'CAFE' | 'BAR' | 'HOTEL' | 'AUBERGE' | 'MAISON_D_HOTES'
  | 'LOCATION_SAISONNIERE' | 'BOUTIQUE_VETEMENTS' | 'BOUTIQUE_CHAUSSURES'
  | 'BOUTIQUE_COSMETIQUES' | 'BOUTIQUE_INFORMATIQUE' | 'BOUTIQUE_TELEPHONIQUE'
  | 'BOUTIQUE_ELECTRONIQUE' | 'SUPERMARCHE' | 'EPICERIE' | 'PHARMACIE'
  | 'LIBRAIRIE' | 'PAPETERIE' | 'SALON_COIFFURE' | 'SALON_BEAUTE'
  | 'SPA' | 'INSTITUT_ESTHETIQUE' | 'PHOTOGRAPHE' | 'VIDEOASTE'
  | 'AGENCE_MARKETING' | 'AGENCE_COMMUNICATION' | 'AGENCE_DIGITALE'
  | 'AGENCE_IMMOBILIERE' | 'CABINET_JURIDIQUE' | 'CABINET_COMPTABLE'
  | 'CABINET_CONSEIL' | 'CABINET_MEDICAL' | 'CLINIQUE'
  | 'CENTRE_FORMATION' | 'ECOLE_PRIVEE' | 'FREELANCE' | 'DEVELOPPEUR'
  | 'DESIGNER_GRAPHIQUE' | 'CONSULTANT' | 'COACH_PROFESSIONNEL'
  | 'ARTISAN' | 'MENUISIER' | 'MACON' | 'PLOMBIER' | 'ELECTRICIEN'
  | 'SOUDEUR' | 'MECANICIEN' | 'ENTREPRISE_AGRICOLE' | 'ELEVAGE'
  | 'TRANSPORT' | 'LIVRAISON' | 'ORGANISATION_EVENEMENTS'
  | 'LOCATION_VEHICULES' | 'LOCATION_EQUIPEMENTS' | 'LOCATION_ENGINS'
  | 'IMPORT_EXPORT' | 'ASSOCIATION' | 'ONG' | 'ENTREPRISE_PRIVEE' | 'AUTRE';

export type BusinessModule =
  | 'PRODUCTS' | 'SERVICES' | 'MENU' | 'ROOMS' | 'BOOKINGS' | 'ORDERS'
  | 'QUOTES_INVOICES' | 'DEBTS_PAYMENTS' | 'PROMOTIONS' | 'PLANNING'
  | 'EMPLOYEES' | 'PORTFOLIO' | 'SUBSCRIPTIONS' | 'DELIVERIES' | 'EVENTS'
  | 'RENTALS' | 'DOCUMENTS' | 'PARTNERS' | 'DISPUTES' | 'MODULE_MARKETPLACE'
  | 'ADVANCED_TASKS' | 'TRAINING';

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

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  type: BusinessType;
  modules: BusinessModule[];
  description: string | null;
  shortDescription: string | null;
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
  isPremium: boolean;
  isNew: boolean;
  isTopSeller: boolean;
  isTopProvider: boolean;
  isRecommended: boolean;
  onboardingCompleted: boolean;
  onboardedAt: string | null;
  settings: BusinessSettings | null;
  hours: BusinessHour[];
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

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  brand: string | null;
  price: number;
  currency: string;
  comparePrice: number | null;
  costPrice: number | null;
  images: string[];
  video: string | null;
  tags: string[];
  stock: number;
  lowStockThreshold: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  weightUnit: string | null;
  unit: string | null;
  dimensions: string | null;
  deliveryFee: number | null;
  isActive: boolean;
  isPhysical: boolean;
  hasVariants: boolean;
  isPromotional: boolean;
  promotionalPrice: number | null;
  discountPercent: number | null;
  isOnPreOrder: boolean;
  isVisibleOnPublicPage: boolean;
  isVisibleOnMarketplace: boolean;
  featured: boolean;
  sortOrder: number;
  rating: number;
  reviewCount: number;
  orderCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { id: string; name: string; slug: string } | null;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration: number | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  icon?: string;
  image?: string;
  parentId?: string | null;
  children?: MenuCategory[];
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  shortDescription?: string | null;
  description: string | null;
  price: number;
  promotionalPrice?: number;
  currency: string;
  images: string[];
  video?: string;
  tags?: string[];
  isAvailable: boolean;
  isActive?: boolean;
  isPopular?: boolean;
  isStar?: boolean;
  isPromotional?: boolean;
  discountPercent?: number;
  featured?: boolean;
  sortOrder: number;
  type?: string;
  status?: string;
  category?: { id: string; name: string } | null;
  prepTime?: number;
  cookTime?: number;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  hasVariants?: boolean;
  variants?: MenuItemVariant[];
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  roomNumber?: string;
  type?: string;
  shortDescription?: string | null;
  description: string | null;
  price: number;
  priceWeekend?: number;
  priceHighSeason?: number;
  priceLowSeason?: number;
  currency: string;
  capacity: number;
  adults?: number;
  children?: number;
  beds?: number;
  size?: number;
  bathroom?: string;
  images: string[];
  video?: string;
  amenities: string[];
  isAvailable: boolean;
  status?: string;
  isActive?: boolean;
  featured?: boolean;
  isPromotional?: boolean;
  promotionalPrice?: number;
  checkInTime?: string;
  checkOutTime?: string;
  quantity: number;
  breakfastIncluded?: boolean;
  rating?: number;
  reviewCount?: number;
  bookingCount?: number;
  createdAt?: string;
}

export interface BusinessEvent {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  price: number | null;
  currency: string;
  images: string[];
  capacity: number | null;
  isActive: boolean;
}

export interface Rental {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  unit: string;
  images: string[];
  quantity: number;
  deposit: number | null;
  isAvailable: boolean;
  weeklyPrice?: number;
  conditions?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  url: string | null;
  category: string | null;
  date: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  code: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  image: string | null;
}

export interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  isActive: boolean;
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
}

export interface OnboardingPaymentMethod {
  method: string;   // TMONEY, FLOOZ, WAVE, MOOV_MONEY, BANK, STRIPE
  name: string;     // Nom du compte (e.g. 'Koffi Kouassi')
  number: string;   // Numéro associé
  isActive: boolean;
}

export interface OnboardingData {
  name: string;
  type: string;
  shortDescription?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  country: string;
  city: string;
  modules: string[];
  logo?: string;
  coverImage?: string;
  latitude?: number;
  longitude?: number;
  managerName?: string;
  experience?: number;
  managerBio?: string;
  skills?: string[];
  certifications?: string[];
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  paymentMethods?: OnboardingPaymentMethod[];
}

const fs = require('fs');

// Build the COMPLETE Prisma schema from scratch
// Based on: migration SQL (base) + all module additions from conversation

let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  CLIENT
  BUSINESS
  DEVELOPER
  ADMIN
}

enum OtpType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  LOGIN
}

enum SecurityLogAction {
  LOGIN
  LOGOUT
  SIGNUP
  PASSWORD_CHANGE
  PASSWORD_RESET
  EMAIL_VERIFICATION
  OTP_VERIFICATION
  DEVICE_ADDED
  DEVICE_REMOVED
  SESSION_CREATED
  SESSION_REVOKED
  FAILED_LOGIN
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED
  ROLE_ACTIVATION
}

enum NotificationType {
  ORDER_PLACED
  ORDER_CONFIRMED
  ORDER_PREPARING
  ORDER_SHIPPED
  ORDER_DELIVERED
  ORDER_CANCELLED
  BOOKING_CONFIRMED
  BOOKING_REMINDER
  BOOKING_CANCELLED
  PAYMENT_RECEIVED
  PAYMENT_REMINDER
  PAYMENT_REFUNDED
  REVIEW_RESPONSE
  NEW_MESSAGE
  PROMOTION
  NEW_EVENT
  SECURITY_ALERT
  DISPUTE_OPENED
  DISPUTE_RESOLVED
  SYSTEM
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
}

enum BusinessType {
  RESTAURANT
  FAST_FOOD
  PATISSERIE
  BOULANGERIE
  CAFE
  BAR
  HOTEL
  AUBERGE
  MAISON_D_HOTES
  LOCATION_SAISONNIERE
  BOUTIQUE_VETEMENTS
  BOUTIQUE_CHAUSSURES
  BOUTIQUE_COSMETIQUES
  BOUTIQUE_INFORMATIQUE
  BOUTIQUE_TELEPHONIQUE
  BOUTIQUE_ELECTRONIQUE
  SUPERMARCHE
  EPICERIE
  PHARMACIE
  LIBRAIRIE
  PAPETERIE
  SALON_COIFFURE
  SALON_BEAUTE
  SPA
  INSTITUT_ESTHETIQUE
  PHOTOGRAPHE
  VIDEOASTE
  AGENCE_MARKETING
  AGENCE_COMMUNICATION
  AGENCE_DIGITALE
  AGENCE_IMMOBILIERE
  CABINET_JURIDIQUE
  CABINET_COMPTABLE
  CABINET_CONSEIL
  CABINET_MEDICAL
  CLINIQUE
  CENTRE_FORMATION
  ECOLE_PRIVEE
  FREELANCE
  DEVELOPPEUR
  DESIGNER_GRAPHIQUE
  CONSULTANT
  COACH_PROFESSIONNEL
  ARTISAN
  MENUISIER
  MACON
  PLOMBIER
  ELECTRICIEN
  SOUDEUR
  MECANICIEN
  ENTREPRISE_AGRICOLE
  ELEVAGE
  TRANSPORT
  LIVRAISON
  ORGANISATION_EVENEMENTS
  LOCATION_VEHICULES
  LOCATION_EQUIPEMENTS
  LOCATION_ENGINS
  IMPORT_EXPORT
  ASSOCIATION
  ONG
  ENTREPRISE_PRIVEE
  AUTRE
}

enum BusinessModule {
  PRODUCTS
  SERVICES
  MENU
  ROOMS
  BOOKINGS
  ORDERS
  QUOTES_INVOICES
  DEBTS_PAYMENTS
  PROMOTIONS
  PLANNING
  EMPLOYEES
  PORTFOLIO
  SUBSCRIPTIONS
  DELIVERIES
  EVENTS
  RENTALS
  DOCUMENTS
  PARTNERS
  DISPUTES
  MODULE_MARKETPLACE
  ADVANCED_TASKS
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum OrderType {
  DELIVERY
  PICKUP
  DINE_IN
  TAKEAWAY
}

enum OrderSource {
  WEB_SITE
  MARKETPLACE
  WHATSAPP
  PHONE
  WALK_IN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  RESCHEDULED
}

enum BookingType {
  SERVICE
  ROOM
  EVENT
  RESOURCE
  TABLE
}

enum BookingSource {
  AFRIBIZ_SITE
  MARKETPLACE
  WHATSAPP
  PHONE
  WALK_IN
}

enum PaymentMethod {
  MOBILE_MONEY
  BANK_TRANSFER
  CREDIT_CARD
  ESCROW
  CASH
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum MenuItemType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
  DESSERT
  DRINK
  COCKTAIL
  SPECIAL
  EVENT
}

enum MenuItemStatus {
  AVAILABLE
  OUT_OF_STOCK
  DISABLED
  PROMO
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
  CONVERTED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  PARTIALLY_PAID
  OVERDUE
  CANCELLED
}

enum DebtStatus {
  ACTIVE
  PARTIALLY_PAID
  OVERDUE
  CRITICAL
  DISPUTED
  SETTLED
  CANCELLED
}

enum DebtPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum DebtSourceType {
  ORDER
  BOOKING
  INVOICE
  SUBSCRIPTION
  PROJECT
  PHYSICAL_SALE
}

enum ClientRiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum EscrowStatus {
  HELD
  RELEASED
  REFUNDED
  DISPUTED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  ON_HOLD
  DONE
  BLOCKED
}

enum TaskRecurrence {
  NONE
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

enum ShiftType {
  MORNING
  AFTERNOON
  EVENING
  NIGHT
  CUSTOM
}

enum CalendarEventType {
  APPOINTMENT
  RESERVATION
  TASK
  DELIVERY
  ABSENCE
  HOLIDAY
  MAINTENANCE
  OTHER
}

enum EmployeeStatus {
  ACTIVE
  SUSPENDED
  ON_LEAVE
  INACTIVE
}

enum EmployeePermission {
  VIEW_ORDERS
  MODIFY_STOCK
  MANAGE_BOOKINGS
  ACCESS_FINANCES
  MANAGE_EMPLOYEES
  REPLY_CLIENTS
  VIEW_SCHEDULE
  MANAGE_TASKS
  VIEW_STATS
}

enum AttendanceMethod {
  MANUAL
  QR_CODE
  PIN
  GPS
}

enum EmployeeDocumentType {
  CONTRACT
  ID_CARD
  CV
  CERTIFICATE
  LICENSE
  PERMIT
  OTHER
}

enum LeaveType {
  VACATION
  SICK
  PERSONAL
  MATERNITY
  PATERNITY
  OTHER
}

enum PerformanceRating {
  EXCELLENT
  GOOD
  AVERAGE
  BELOW_AVERAGE
  POOR
}

enum PromotionType {
  PERCENTAGE
  FIXED
  FREE_DELIVERY
  BUNDLE
  HAPPY_HOUR
  FLASH_SALE
  VIP
  BIRTHDAY
  LOYALTY_POINTS
  CASHBACK
}

enum PromotionTargetType {
  PRODUCT
  SERVICE
  MENU_ITEM
  ROOM
  EVENT
  DELIVERY
  ALL
}

enum CouponStatus {
  ACTIVE
  USED
  EXPIRED
  DISABLED
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
}

enum CampaignChannel {
  WHATSAPP
  FACEBOOK
  INSTAGRAM
  TIKTOK
  PUSH
  EMAIL
  SMS
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
}

enum PortfolioMediaType {
  IMAGE
  VIDEO
  BEFORE_AFTER
  DOCUMENT
}

enum PortfolioInteractionType {
  LIKE
  SHARE
  COMMENT
  SAVE
}

enum SubscriptionPlanType {
  STANDARD
  PREMIUM
  VIP
  ENTERPRISE
  UNLIMITED
  FREE_TRIAL
}

enum BillingCycle {
  WEEKLY
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
  CUSTOM
}

enum SubscriptionRenewalStatus {
  PENDING
  ACTIVE
  FAILED
  CANCELLED
  EXPIRED
}

enum DeliveryStatus {
  PREPARING
  ASSIGNED
  IN_TRANSIT
  ARRIVED
  DELIVERED
  FAILED
  CANCELLED
}

enum DeliveryType {
  STANDARD
  EXPRESS
  SCHEDULED
  PICKUP
  GROUPED
}

enum DriverStatus {
  AVAILABLE
  BUSY
  OFFLINE
  ON_BREAK
}

enum DriverVehicleType {
  MOTORCYCLE
  BICYCLE
  CAR
  VAN
  TRUCK
  FOOT
}

enum AdvertiserType {
  BUSINESS
  DEVELOPER
  EXTERNAL
}

enum AdStatus {
  PENDING
  VALIDATED
  REJECTED
  SCHEDULED
  ACTIVE
  COMPLETED
  SUSPENDED
}

enum AdPlacementPage {
  HOMEPAGE
  MARKETPLACE
  DASHBOARD_CLIENT
  DASHBOARD_BUSINESS
  DASHBOARD_DEVELOPER
  MODULE_PAGE
  EVENT_PAGE
  NOTIFICATION_CENTER
}

enum AdPlacementPosition {
  HERO_BANNER
  TOP_BANNER
  BOTTOM_BANNER
  SIDEBAR
  SPONSORED_CARD
  SPONSORED_RESULT
  CAROUSEL
  FEATURED_BLOCK
  PROMO_WIDGET
  RECOMMENDED
  POPUP
}

enum AdFormat {
  BANNER_HORIZONTAL
  BANNER_VERTICAL
  SPONSORED_CARD
  CAROUSEL
  WIDGET
  VIDEO
  POPUP
  NOTIFICATION
}

enum AdObjective {
  BRAND_AWARENESS
  TRAFFIC
  LEADS
  SALES
  INSTALLS
  PROMOTION
}

enum ScoreCategory {
  VERY_LOW
  LOW
  MEDIUM
  GOOD
  EXCELLENT
}

enum BadgeType {
  BUSINESS_VERIFIED
  PAYMENT_VERIFIED
  TOP_SELLER
  TOP_PROVIDER
  TOP_RESTAURANT
  TOP_HOTEL
  TOP_RENTER
  TOP_EVENT
  BUSINESS_PREMIUM
  BUSINESS_RECOMMENDED
  BUSINESS_RELIABLE
  BUSINESS_ELITE
}

enum DataShareLevel {
  NONE
  BANKS_ONLY
  INSURANCE_ONLY
  INVESTORS_ONLY
  PUBLIC_INSTITUTIONS_ONLY
  ALL_PARTNERS
}

enum PartnerType {
  BANK
  FINANCIAL_INSTITUTION
  MICROFINANCE
  INSURANCE
  INVESTOR
  DEVELOPMENT_ORGANIZATION
  CHAMBER_OF_COMMERCE
  PUBLIC_INSTITUTION
}

enum ReportType {
  SOLVABILITY
  GROWTH
  PERFORMANCE
  RELIABILITY
  FINANCIAL
  SECTORIAL
  GEOGRAPHIC
  ECONOMIC
  TREND
  CUSTOM
}

enum ReportStatus {
  GENERATING
  READY
  FAILED
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  SUSPENDED
}

enum FinancialLogAction {
  PAYMENT_RECEIVED
  PAYMENT_SENT
  DEBT_CREATED
  DEBT_SETTLED
  DEBT_WRITTEN_OFF
  ESCROW_CREATED
  ESCROW_RELEASED
  ESCROW_REFUNDED
  REFUND_ISSUED
  MANUAL_ADJUSTMENT
}

enum DebtReminderType {
  DUE_DATE
  OVERDUE
  PAYMENT_CONFIRMATION
  CRITICAL_DEBT
}

enum DebtReminderChannel {
  WHATSAPP
  SMS
  PUSH
  EMAIL
}

enum DebtReminderStatus {
  PENDING
  SENT
  FAILED
}

// ============================================
// CORE USER MODELS
// ============================================

model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  phone               String?   @unique
  firstName           String
  lastName            String
  passwordHash        String
  emailVerified       Boolean   @default(false)
  phoneVerified       Boolean   @default(false)
  isActive            Boolean   @default(true)

  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  lastLoginIp         String?

  avatar              String?
  country             String?
  region              String?
  city                String?
  neighborhood        String?
  birthDate           DateTime?
  businessName        String?
  businessRegistration String?
  developerApiKey     String?   @unique
  twoFactorEnabled    Boolean   @default(false)
  rememberMeToken     String?   @unique

  primaryRole         UserRole  @default(CLIENT)
  roles               UserRole[]  @default([CLIENT])

  sessions            Session[]
  refreshTokens       RefreshToken[]
  passwordResets      PasswordReset[]
  emailVerifications  EmailVerification[]
  otpCodes            OtpCode[]
  securityLogs        SecurityLog[]
  devices             Device[]
  notifications       Notification[]
  notificationPreferences NotificationPreference[]
  products            Product[]         @relation("SellerProducts")
  orders              Order[]           @relation("BuyerOrders")
  bookings            Booking[]         @relation("ClientBookings")
  providedBookings    Booking[]         @relation("ProviderBookings")
  payments            Payment[]         @relation("UserPayments")
  reviews             Review[]          @relation("UserReviews")
  business            Business?
  developerProfile    DeveloperProfile?
  businessReviews     BusinessReview[]
  sentMessages        Message[]         @relation("SentMessages")
  debts               Debt[]
  clientRisks         ClientRisk[]
  financialLogs       FinancialLog[]
  planningLogs        PlanningLog[]
  coupons             Coupon[]
  loyalties           LoyaltyPoints[]
  quotes              Quote[]            @relation("ClientQuotes")
  invoices            Invoice[]          @relation("ClientInvoices")
  favorites           Favorite[]        @relation("UserFavorites")
  developerModuleReviews DeveloperModuleReview[]
  developerSupportMessages DeveloperSupportMessage[]
  employees           Employee[]
  clientSubscriptions  BusinessSubscription[] @relation("ClientSubscriptions")

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  @@index([email])
  @@index([phone])
  @@index([primaryRole])
  @@index([createdAt])
  @@index([deletedAt])
}

model Session {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent       String?
  ipAddress       String
  deviceId        String?
  device          Device?   @relation(fields: [deviceId], references: [id])
  isActive        Boolean   @default(true)
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  revokedAt       DateTime?

  @@index([userId])
  @@index([expiresAt])
  @@index([isActive])
}

model RefreshToken {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String    @unique
  sessionId       String?
  expiresAt       DateTime
  revokedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

model PasswordReset {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String    @unique
  expiresAt       DateTime
  usedAt          DateTime?
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([token])
}

model EmailVerification {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String    @unique
  email           String
  expiresAt       DateTime
  verifiedAt      DateTime?
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([token])
  @@index([email])
}

model OtpCode {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  code            String
  type            OtpType
  destination     String
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)
  expiresAt       DateTime
  verifiedAt      DateTime?
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([code])
  @@index([expiresAt])
}

model Device {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  deviceType      String
  osType          String
  browserName     String?
  browserVersion  String?
  ipAddress       String
  userAgent       String?
  isCurrentDevice Boolean   @default(false)
  lastUsedAt      DateTime?
  sessions        Session[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  revokedAt       DateTime?

  @@index([userId])
  @@index([createdAt])
}

model SecurityLog {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  action          SecurityLogAction
  ipAddress       String?
  userAgent       String?
  deviceId        String?
  success         Boolean   @default(true)
  reason          String?
  metadata        Json?
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ============================================
// NOTIFICATION MODELS
// ============================================

model Notification {
  id              String            @id @default(uuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            NotificationType
  title           String
  description     String?
  link            String?
  metadata        Json?
  read            Boolean           @default(false)
  readAt          DateTime?
  deliveries      NotificationDelivery[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([userId])
  @@index([userId, read])
  @@index([type])
  @@index([createdAt])
}

model NotificationDelivery {
  id              String            @id @default(uuid())
  notificationId  String
  notification    Notification      @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  channel         NotificationChannel
  status          String            @default("pending")
  sentAt          DateTime?
  errorMessage    String?
  createdAt       DateTime          @default(now())

  @@index([notificationId])
  @@index([channel, status])
}

model NotificationPreference {
  id              String            @id @default(uuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            NotificationType
  channel         NotificationChannel
  enabled         Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([userId, type, channel])
  @@index([userId])
}

// ============================================
// BUSINESS PROFILE MODELS
// ============================================

model Business {
  id                String    @id @default(uuid())
  ownerId           String    @unique
  owner             User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name              String
  slug              String    @unique
  type              BusinessType
  modules           BusinessModule[] @default([])
  description       String?
  shortDescription  String?
  email             String?
  phone             String?
  website           String?
  logo              String?
  coverImage        String?
  country           String?
  city              String?
  region            String?
  address           String?
  latitude          Float?
  longitude         Float?
  whatsapp          String?
  facebook          String?
  instagram         String?
  twitter           String?
  linkedin          String?
  tiktok            String?
  youtube           String?
  mission           String?
  vision            String?
  values            String?
  foundedYear       Int?
  employeeCount     Int?
  rating            Float     @default(0)
  reviewCount       Int       @default(0)
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
  isPremium         Boolean   @default(false)
  isNew             Boolean   @default(true)
  isTopSeller       Boolean   @default(false)
  isTopProvider     Boolean   @default(false)
  isRecommended     Boolean   @default(false)
  taxId             String?
  businessLicense   String?
  managerName       String?
  managerBio        String?
  experience        Int?
  skills            String[]
  certifications    String[]
  onboardingCompleted Boolean @default(false)
  onboardedAt       DateTime?

  settings          BusinessSettings?
  hours             BusinessHour[]
  paymentMethods    BusinessPaymentMethod[]
  deliveryZones     DeliveryZone[]
  services          Service[]
  serviceCategories ServiceCategory[]
  menuCategories    MenuCategory[]
  menuItems         MenuItem[]
  ingredients       Ingredient[]
  restaurantTables  RestaurantTable[]
  menuOrders        MenuOrder[]
  bookings          Booking[]
  bookingResources  BookingResource[]
  timeSlots         TimeSlot[]
  rooms             Room[]
  events            Event[]
  rentals           Rental[]
  portfolioItems    PortfolioItem[]
  portfolioCategories PortfolioCategory[]
  portfolioMedia    PortfolioMedia[]
  portfolioInteractions PortfolioInteraction[]
  portfolioTestimonials PortfolioTestimonial[]
  partners          Partner[]
  reviews           BusinessReview[]
  products          Product[]
  productCategories ProductCategory[]
  moduleInstallations DeveloperModuleInstallation[]
  supportTickets    DeveloperSupportTicket[]
  adCampaigns       AdCampaign[]
  orders            Order[]
  debts             Debt[]
  escrows           Escrow[]
  clientRisks       ClientRisk[]
  financialLogs     FinancialLog[]
  planningTasks     PlanningTask[]
  employees         Employee[]
  employeeRoles     EmployeeRole[]
  attendances       Attendance[]
  employeeDocuments EmployeeDocument[]
  employeePerformances EmployeePerformance[]
  employeeActivities EmployeeActivity[]
  drivers           Driver[]
  deliveries        Delivery[]
  deliveryTracking   DeliveryTracking[]
  deliveryProofs     DeliveryProof[]
  employeeSchedules EmployeeSchedule[]
  planningLogs      PlanningLog[]
  promotions       Promotion[]
  coupons          Coupon[]
  bundles          Bundle[]
  campaigns        MarketingCampaign[]
  promotionLogs    PromotionLog[]
  loyaltyProgram   LoyaltyProgram?
  loyalties        LoyaltyPoints[]
  subscriptionPlans   SubscriptionPlan[]
  subscriptionSubs    BusinessSubscription[]
  subscriptionPayments SubscriptionPayment[]
  subscriptionLogs    SubscriptionLog[]
  invoices          Invoice[]
  quotes            Quote[]
  score             BusinessScore?
  scoreHistory      ScoreHistory[]
  badges            BusinessBadge[]
  consent           DataConsent?
  accessLogs        DataAccessLog[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  @@index([slug])
  @@index([ownerId])
  @@index([type])
  @@index([isActive])
}

model BusinessSettings {
  id                String   @id @default(uuid())
  businessId        String   @unique
  business          Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  currency          String   @default("FCFA")
  timezone          String   @default("Africa/Lome")
  language          String   @default("fr")
  dateFormat        String   @default("DD/MM/YYYY")
  autoConfirmBookings    Boolean @default(false)
  autoConfirmOrders      Boolean @default(false)
  allowOnlinePayments    Boolean @default(true)
  allowCashOnDelivery    Boolean @default(true)
  requirePhoneForOrders  Boolean @default(true)
  notificationEmail String?
  notificationPhone String?
  notifyNewOrders   Boolean @default(true)
  notifyNewBookings Boolean @default(true)
  notifyNewReviews  Boolean @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model BusinessHour {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  day         Int
  open        String?
  close       String?
  isClosed    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([businessId, day])
  @@index([businessId])
}

model BusinessPaymentMethod {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  method      String
  name        String?
  number      String?
  nameOnAccount String?
  isActive    Boolean  @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([businessId])
}

model DeliveryZone {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  fee         Decimal  @db.Decimal(12, 2)
  minOrder    Decimal? @db.Decimal(12, 2)
  estimatedTime Int?
  isActive    Boolean  @default(true)
  orders          Order[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([businessId])
}

// ============================================
// SERVICE MODELS
// ============================================

model Service {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  categoryId          String?
  category            ServiceCategory? @relation(fields: [categoryId], references: [id])
  name                String
  shortDescription    String?
  description         String?
  tags                String[]
  images              String[]
  video               String?
  price               Decimal?        @db.Decimal(12, 2)
  priceType           String          @default("FIXED")
  minPrice           Decimal?        @db.Decimal(12, 2)
  currency            String          @default("FCFA")
  isPromotional       Boolean         @default(false)
  promotionalPrice    Decimal?        @db.Decimal(12, 2)
  discountPercent     Int?            @default(0)
  promotionEndsAt     DateTime?
  duration            Int?
  durationMin         Int?
  durationMax         Int?
  availability        String          @default("ALWAYS")
  bookingRequired     Boolean         @default(true)
  depositRequired     Boolean         @default(false)
  depositAmount       Decimal?        @db.Decimal(12, 2)
  autoConfirm         Boolean         @default(false)
  locationType        String          @default("ON_SITE")
  isActive            Boolean         @default(true)
  isVisibleOnPublicPage Boolean       @default(true)
  isVisibleOnMarketplace Boolean      @default(true)
  seoTitle            String?
  seoDescription      String?
  featured            Boolean         @default(false)
  sortOrder           Int             @default(0)
  rating              Float           @default(0)
  reviewCount         Int             @default(0)
  bookingCount        Int             @default(0)

  employees           ServiceEmployee[]
  reviews             Review[]
  bookings            Booking[]
  orderItems          OrderItem[]

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  deletedAt           DateTime?

  @@index([businessId])
  @@index([categoryId])
  @@index([isActive])
  @@index([featured])
}

model ServiceCategory {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  slug        String
  description String?
  icon        String?
  image       String?
  parentId    String?
  parent      ServiceCategory? @relation("ServiceCategoryTree", fields: [parentId], references: [id])
  children    ServiceCategory[] @relation("ServiceCategoryTree")
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  services    Service[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@unique([businessId, slug])
  @@index([businessId])
  @@index([parentId])
}

model ServiceEmployee {
  id          String   @id @default(uuid())
  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  name        String
  title       String?
  photo       String?
  bio         String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([serviceId])
}

// ============================================
// MENU MODELS
// ============================================

model MenuCategory {
  id          String     @id @default(uuid())
  businessId  String
  business    Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  description String?
  icon        String?
  image       String?
  parentId    String?
  parent      MenuCategory? @relation("MenuCategoryTree", fields: [parentId], references: [id])
  children    MenuCategory[] @relation("MenuCategoryTree")
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  items       MenuItem[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  @@unique([businessId, name])
  @@index([businessId])
  @@index([parentId])
}

model MenuItem {
  id              String        @id @default(uuid())
  businessId      String
  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        MenuCategory? @relation(fields: [categoryId], references: [id])
  name            String
  description     String?
  shortDescription String?
  type            MenuItemType? @default(LUNCH)
  images          String[]
  video           String?
  tags            String[]
  price           Decimal       @db.Decimal(12, 2)
  currency        String        @default("FCFA")
  isPromotional   Boolean       @default(false)
  promotionalPrice Decimal?      @db.Decimal(12, 2)
  discountPercent Int?          @default(0)
  promotionEndsAt DateTime?
  prepTime        Int?
  cookTime        Int?
  calories        Int?
  allergens       String[]
  hasVariants     Boolean       @default(false)
  status          MenuItemStatus @default(AVAILABLE)
  isAvailable     Boolean       @default(true)
  isActive        Boolean       @default(true)
  isPopular       Boolean       @default(false)
  isStar          Boolean       @default(false)
  featured        Boolean       @default(false)
  sortOrder       Int           @default(0)
  seoTitle        String?
  seoDescription  String?
  rating          Float         @default(0)
  reviewCount     Int           @default(0)
  orderCount      Int           @default(0)
  variants        MenuItemVariant[]
  ingredients     Ingredient[]
  orderItems      OrderItem[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
  @@index([categoryId])
  @@index([status])
  @@index([isActive])
  @@index([isPopular])
}

model MenuItemVariant {
  id          String    @id @default(uuid())
  menuItemId  String
  menuItem    MenuItem  @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  name        String
  price       Decimal   @db.Decimal(12, 2)
  currency    String    @default("FCFA")
  isAvailable Boolean   @default(true)
  createdAt   DateTime  @default(now())

  @@index([menuItemId])
}

model Ingredient {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  unit        String?
  stock       Decimal?  @db.Decimal(12, 2)
  minStock    Decimal?  @db.Decimal(12, 2)
  isActive    Boolean   @default(true)
  menuItems   MenuItem[] @relation("MenuItemIngredients")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([businessId])
}

model RestaurantTable {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  number      Int
  capacity    Int       @default(4)
  location    String?
  isAvailable Boolean   @default(true)
  isActive    Boolean   @default(true)
  menuOrders  MenuOrder[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([businessId, number])
  @@index([businessId])
}

model MenuOrder {
  id          String          @id @default(uuid())
  businessId  String
  business    Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  tableId     String?
  table       RestaurantTable? @relation(fields: [tableId], references: [id])
  status      String          @default("PENDING")
  items       Json?
  total       Decimal         @db.Decimal(12, 2)
  notes       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([businessId])
  @@index([tableId])
}

// ============================================
// PRODUCT MODELS
// ============================================

model ProductCategory {
  id          String     @id @default(uuid())
  businessId  String
  business    Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  slug        String
  description String?
  icon        String?
  image       String?
  parentId    String?
  parent      ProductCategory? @relation("ProductCategoryTree", fields: [parentId], references: [id])
  children    ProductCategory[] @relation("ProductCategoryTree")
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  @@unique([businessId, slug])
  @@index([businessId])
  @@index([parentId])
}

model Product {
  id              String          @id @default(uuid())
  businessId      String?
  business        Business?       @relation(fields: [businessId], references: [id])
  sellerId        String
  seller          User            @relation("SellerProducts", fields: [sellerId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        ProductCategory? @relation(fields: [categoryId], references: [id])
  name            String
  slug            String          @unique
  description     String?
  shortDescription String?
  price           Decimal         @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  comparePrice    Decimal?        @db.Decimal(12, 2)
  costPrice       Decimal?        @db.Decimal(12, 2)
  images          String[]
  video           String?
  tags            String[]
  stock           Int             @default(0)
  lowStockThreshold Int?          @default(5)
  sku             String?
  barcode         String?
  weight          Decimal?        @db.Decimal(10, 2)
  weightUnit      String?         @default("kg")
  isActive        Boolean         @default(true)
  isPhysical      Boolean         @default(true)
  hasVariants     Boolean         @default(false)
  isPromotional   Boolean         @default(false)
  promotionalPrice Decimal?        @db.Decimal(12, 2)
  discountPercent Int?            @default(0)
  promotionEndsAt DateTime?
  featured        Boolean         @default(false)
  sortOrder       Int             @default(0)
  rating          Float           @default(0)
  reviewCount     Int             @default(0)
  orderCount      Int             @default(0)
  seoTitle        String?
  seoDescription  String?
  variants        ProductVariant[]
  reviews         Review[]
  favorites       Favorite[]      @relation("ProductFavorites")
  orderItems      OrderItem[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?

  @@index([sellerId])
  @@index([categoryId])
  @@index([slug])
  @@index([isActive])
}

model ProductVariant {
  id          String    @id @default(uuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  name        String
  sku         String?
  price       Decimal   @db.Decimal(12, 2)
  currency    String    @default("FCFA")
  stock       Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([productId])
}

// ============================================
// ORDER MODELS
// ============================================

model Order {
  id                String          @id @default(uuid())
  businessId        String?
  business          Business?       @relation(fields: [businessId], references: [id])
  buyerId           String?
  buyer             User?           @relation("BuyerOrders", fields: [buyerId], references: [id])
  orderNumber       String          @unique
  type              OrderType       @default(DELIVERY)
  source            OrderSource     @default(WEB_SITE)
  status            OrderStatus     @default(PENDING)

  totalAmount       Decimal         @db.Decimal(12, 2)
  subtotal          Decimal?        @db.Decimal(12, 2)
  taxAmount         Decimal?        @db.Decimal(12, 2)
  deliveryFee       Decimal?        @db.Decimal(12, 2)
  discountAmount    Decimal?        @db.Decimal(12, 2)
  currency          String          @default("FCFA")

  notes             String?
  internalNotes     String?
  deliveryZoneId    String?
  deliveryZone      DeliveryZone?   @relation(fields: [deliveryZoneId], references: [id])
  deliveryStatus    String?         // PENDING, ASSIGNED, IN_TRANSIT, DELIVERED
  deliveryAddress   String?
  deliveryLat       Float?
  deliveryLng       Float?
  contactPhone      String?
  contactName       String?
  scheduledAt       DateTime?
  paidAt            DateTime?
  deliveredAt       DateTime?
  cancelledAt       DateTime?
  cancelReason      String?

  escrow            Escrow?
  items             OrderItem[]
  payments          Payment[]
  debts             Debt[]
  delivery          Delivery?
  planningTasks     PlanningTask[]

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([businessId])
  @@index([buyerId])
  @@index([orderNumber])
  @@index([status])
  @@index([type])
  @@index([createdAt])
}

model OrderItem {
  id          String    @id @default(uuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product?  @relation(fields: [productId], references: [id])
  variantId   String?
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  menuItemId  String?
  menuItem    MenuItem? @relation(fields: [menuItemId], references: [id])
  serviceId   String?
  service     Service?  @relation(fields: [serviceId], references: [id])
  name        String
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(12, 2)
  total       Decimal   @db.Decimal(12, 2)
  notes       String?
  createdAt   DateTime  @default(now())

  @@index([orderId])
  @@index([productId])
}

// ============================================
// BOOKING MODELS
// ============================================

model Booking {
  id                String        @id @default(uuid())
  bookingNumber     String        @unique
  businessId        String?
  business          Business?     @relation(fields: [businessId], references: [id])
  clientId          String
  client            User          @relation("ClientBookings", fields: [clientId], references: [id], onDelete: Cascade)
  providerId        String?
  provider          User?         @relation("ProviderBookings", fields: [providerId], references: [id])
  title             String
  description       String?
  type              BookingType   @default(SERVICE)
  source            BookingSource @default(AFRIBIZ_SITE)
  status            BookingStatus @default(PENDING)
  isWalkIn          Boolean       @default(false)
  serviceId         String?
  service           Service?      @relation(fields: [serviceId], references: [id])
  roomId            String?
  room              Room?         @relation(fields: [roomId], references: [id])
  resourceId        String?
  resource          BookingResource? @relation(fields: [resourceId], references: [id])
  startDate         DateTime
  endDate           DateTime?
  checkIn           DateTime?
  checkOut          DateTime?
  guests            Int           @default(1)
  adults            Int           @default(1)
  children          Int           @default(0)
  numberOfPeople    Int?          @default(1)
  customerName      String?
  customerPhone     String?
  customerEmail     String?
  location          String?
  specialRequests   String?
  notes             String?
  price             Decimal       @db.Decimal(12, 2)
  currency          String        @default("FCFA")
  depositAmount     Decimal?      @db.Decimal(12, 2)
  depositPaid       Boolean       @default(false)
  refundAmount      Decimal?      @db.Decimal(12, 2)
  cancellationPolicy String?
  cancellationFee   Decimal?      @db.Decimal(12, 2)
  cancelledAt       DateTime?
  cancelReason      String?
  checkedInAt       DateTime?
  checkedOutAt      DateTime?
  noShowAt          DateTime?
  isNoShow          Boolean       @default(false)
  remindedAt        DateTime?
  reminderSent      Boolean       @default(false)

  reminders         BookingReminder[]
  payments          Payment[]
  planningTasks     PlanningTask[]

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([businessId])
  @@index([clientId])
  @@index([providerId])
  @@index([serviceId])
  @@index([roomId])
  @@index([resourceId])
  @@index([status])
  @@index([type])
  @@index([startDate])
  @@index([createdAt])
}

model BookingResource {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  type        String
  description String?
  capacity    Int      @default(1)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  bookings    Booking[]
  timeSlots   TimeSlot[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([businessId])
  @@index([type])
}

model TimeSlot {
  id            String   @id @default(uuid())
  businessId    String
  business      Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  resourceId    String?
  resource      BookingResource? @relation(fields: [resourceId], references: [id])
  dayOfWeek     Int
  startTime     String
  endTime       String
  isAvailable   Boolean  @default(true)
  maxCapacity   Int      @default(1)
  slotDuration  Int?
  bufferTime    Int?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([businessId])
  @@index([resourceId])
  @@index([dayOfWeek])
}

model BookingReminder {
  id          String   @id @default(uuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  type        String
  channel     String
  status      String
  sentAt      DateTime?
  errorMessage String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([bookingId])
  @@index([status])
}

// ============================================
// ROOM MODELS
// ============================================

model Room {
  id              String        @id @default(uuid())
  businessId      String
  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  images          String[]
  price           Decimal       @db.Decimal(12, 2)
  currency        String        @default("FCFA")
  capacity        Int           @default(2)
  beds            Int           @default(1)
  amenities       String[]
  isActive        Boolean       @default(true)
  isAvailable     Boolean       @default(true)
  sortOrder       Int           @default(0)
  bookings        Booking[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
  @@index([isActive])
}

// ============================================
// EVENT MODELS
// ============================================

model Event {
  id              String    @id @default(uuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  title           String
  description     String?
  images          String[]
  date            DateTime
  endDate         DateTime?
  location        String?
  price           Decimal?  @db.Decimal(12, 2)
  currency        String    @default("FCFA")
  capacity        Int?
  isActive        Boolean   @default(true)
  isFeatured      Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
  @@index([date])
}

// ============================================
// RENTAL MODELS
// ============================================

model Rental {
  id              String    @id @default(uuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  images          String[]
  price           Decimal   @db.Decimal(12, 2)
  priceUnit       String    @default("day")
  currency        String    @default("FCFA")
  quantity        Int       @default(1)
  availableQty    Int       @default(1)
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
}

// ============================================
// PARTNER MODELS
// ============================================

model Partner {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  description String?
  logo        String?
  website     String?
  phone       String?
  email       String?
  type        String
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([businessId])
}

// ============================================
// REVIEW MODELS
// ============================================

model BusinessReview {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  rating      Int       @default(5)
  title       String?
  comment     String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([businessId])
  @@index([userId])
  @@index([rating])
}

model Review {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation("UserReviews", fields: [userId], references: [id], onDelete: Cascade)
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  serviceId String?
  service   Service? @relation(fields: [serviceId], references: [id])
  rating    Int      @default(5)
  title     String?
  comment   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([productId])
  @@index([serviceId])
  @@index([rating])
}

// ============================================
// MESSAGE MODELS
// ============================================

model Conversation {
  id        String    @id @default(uuid())
  type      String    @default("business")
  subject   String?
  participants String[]
  lastMessageAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]

  @@index([type])
  @@index([participants])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  content        String
  attachment     String?
  read           Boolean      @default(false)
  readAt         DateTime?
  createdAt      DateTime     @default(now())

  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
}

// ============================================
// FAVORITE MODELS
// ============================================

model Favorite {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation("UserFavorites", fields: [userId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation("ProductFavorites", fields: [productId], references: [id])
  type        String
  referenceId String
  createdAt   DateTime @default(now())

  @@unique([userId, referenceId])
  @@index([userId])
  @@index([referenceId])
}

// ============================================
// QUOTE & INVOICE MODELS
// ============================================

model Quote {
  id              String        @id @default(uuid())
  quoteNumber     String        @unique
  businessId      String?
  business        Business?     @relation(fields: [businessId], references: [id])
  clientId        String?
  client          User?         @relation("ClientQuotes", fields: [clientId], references: [id])
  clientName      String?
  clientPhone     String?
  clientEmail     String?
  title           String
  description     String?
  items           Json?
  subtotal        Decimal       @db.Decimal(12, 2)
  taxAmount       Decimal?      @db.Decimal(12, 2)
  discountAmount  Decimal?      @db.Decimal(12, 2)
  totalAmount     Decimal       @db.Decimal(12, 2)
  currency        String        @default("FCFA")
  status          QuoteStatus   @default(DRAFT)
  validUntil      DateTime?
  notes           String?
  terms           String?
  debt            Debt?
  invoice         Invoice?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([businessId])
  @@index([clientId])
  @@index([status])
}

model QuoteItem {
  id          String          @id @default(uuid())
  quoteId     String
  quote       Quote           @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  description String
  quantity    Int             @default(1)
  unitPrice   Decimal         @db.Decimal(12, 2)
  total       Decimal         @db.Decimal(12, 2)
  createdAt   DateTime        @default(now())

  @@index([quoteId])
}

model Invoice {
  id              String          @id @default(uuid())
  invoiceNumber   String          @unique
  businessId      String?
  business        Business?       @relation(fields: [businessId], references: [id])
  clientId        String?
  client          User?           @relation("ClientInvoices", fields: [clientId], references: [id])
  quoteId         String?
  quote           Quote?          @relation(fields: [quoteId], references: [id])
  clientName      String?
  clientPhone     String?
  clientEmail     String?
  title           String
  description     String?
  items           Json?
  subtotal        Decimal         @db.Decimal(12, 2)
  taxAmount       Decimal?        @db.Decimal(12, 2)
  discountAmount  Decimal?        @db.Decimal(12, 2)
  totalAmount     Decimal         @db.Decimal(12, 2)
  amountPaid      Decimal?        @default(0) @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  status          InvoiceStatus   @default(DRAFT)
  dueDate         DateTime?
  paidAt          DateTime?
  notes           String?
  terms           String?
  debt            Debt?
  payments        Payment[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([businessId])
  @@index([clientId])
  @@index([status])
}

model InvoiceItem {
  id          String          @id @default(uuid())
  invoiceId   String
  invoice     Invoice         @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int             @default(1)
  unitPrice   Decimal         @db.Decimal(12, 2)
  total       Decimal         @db.Decimal(12, 2)
  createdAt   DateTime        @default(now())

  @@index([invoiceId])
}

// ============================================
// PAYMENT MODELS
// ============================================

model Payment {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation("UserPayments", fields: [userId], references: [id], onDelete: Cascade)
  escrowId      String?
  escrow        Escrow?       @relation(fields: [escrowId], references: [id])
  quoteId       String?
  quote         Quote?        @relation(fields: [quoteId], references: [id])
  invoiceId     String?
  invoice       Invoice?      @relation(fields: [invoiceId], references: [id])
  orderId       String?
  order         Order?        @relation(fields: [orderId], references: [id])
  bookingId     String?
  booking       Booking?      @relation(fields: [bookingId], references: [id])
  amount        Decimal       @db.Decimal(12, 2)
  currency      String        @default("FCFA")
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  reference     String?
  description   String?
  paidAt        DateTime?
  refundedAt    DateTime?
  isManual      Boolean       @default(false)
  verifiedBy    String?
  verifiedAt    DateTime?
  verificationNotes String?
  proofs        PaymentProof[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId])
  @@index([escrowId])
  @@index([orderId])
  @@index([status])
  @@index([createdAt])
}

model PaymentProof {
  id        String   @id @default(uuid())
  paymentId String
  payment   Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  imageUrl  String
  notes     String?
  verified  Boolean  @default(false)
  verifiedBy String?
  verifiedAt DateTime?
  rejectionReason String?
  createdAt DateTime @default(now())

  @@index([paymentId])
}

// ============================================
// DEBT & ESCROW MODELS (Module 8)
// ============================================

model Debt {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  buyerId         String?
  buyer           User?           @relation(fields: [buyerId], references: [id])
  orderId         String?
  order           Order?          @relation(fields: [orderId], references: [id])
  invoiceId       String?
  invoice         Invoice?        @relation(fields: [invoiceId], references: [id])
  quoteId         String?
  quote           Quote?          @relation(fields: [quoteId], references: [id])

  totalAmount     Decimal         @db.Decimal(12, 2)
  amountPaid      Decimal         @default(0) @db.Decimal(12, 2)
  remainingAmount Decimal         @default(0) @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  dueDate         DateTime?
  status          DebtStatus      @default(ACTIVE)
  priority        DebtPriority    @default(MEDIUM)
  sourceType      DebtSourceType  @default(ORDER)
  riskLevel       ClientRiskLevel @default(LOW)
  notes           String?
  reminders       DebtReminder[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([businessId])
  @@index([buyerId])
  @@index([status])
  @@index([priority])
}

model Escrow {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  orderId         String?
  order           Order?          @relation(fields: [orderId], references: [id])
  invoiceId       String?
  invoice         Invoice?        @relation(fields: [invoiceId], references: [id])
  quoteId         String?
  quote           Quote?          @relation(fields: [quoteId], references: [id])

  amount          Decimal         @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  status          EscrowStatus    @default(HELD)
  releasedAt      DateTime?
  refundedAt      DateTime?
  disputedAt      DateTime?
  disputeReason   String?
  notes           String?
  payments        Payment[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([businessId])
  @@index([orderId])
  @@index([invoiceId])
  @@index([status])
}

model ClientRisk {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  clientId        String
  client          User            @relation(fields: [clientId], references: [id])
  riskLevel       ClientRiskLevel @default(LOW)
  reliabilityScore Int?           @default(50)
  latePaymentCount Int            @default(0)
  disputeCount    Int             @default(0)
  totalDebtAmount Decimal?        @default(0) @db.Decimal(12, 2)
  maxCreditAmount Decimal?        @db.Decimal(12, 2)
  requireDeposit  Boolean         @default(false)
  blacklisted     Boolean         @default(false)
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([businessId, clientId])
  @@index([businessId])
  @@index([clientId])
  @@index([riskLevel])
}

model DebtReminder {
  id              String            @id @default(uuid())
  debtId          String
  debt            Debt              @relation(fields: [debtId], references: [id], onDelete: Cascade)
  type            DebtReminderType
  channel         DebtReminderChannel
  status          DebtReminderStatus @default(PENDING)
  content         String?
  sentAt          DateTime?
  errorMessage    String?
  createdAt       DateTime          @default(now())

  @@index([debtId])
  @@index([status])
  @@index([type])
}

model FinancialLog {
  id              String              @id @default(uuid())
  businessId      String
  business        Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  userId          String?
  user            User?               @relation(fields: [userId], references: [id])
  action          FinancialLogAction
  amount          Decimal?            @db.Decimal(12, 2)
  currency        String?             @default("FCFA")
  description     String?
  reference       String?
  metadata        Json?
  createdAt       DateTime            @default(now())

  @@index([businessId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ============================================
// PLANNING MODELS (Module 10)
// ============================================

model PlanningTask {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  orderId         String?
  order           Order?          @relation(fields: [orderId], references: [id])
  bookingId       String?
  booking         Booking?        @relation(fields: [bookingId], references: [id])
  assigneeId      String?
  assignee        Employee?       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  assignedTo      String?

  title           String
  description     String?
  priority        TaskPriority    @default(MEDIUM)
  status          TaskStatus      @default(TODO)
  recurrence      TaskRecurrence  @default(NONE)
  recurrenceRule  String?
  dueDate         DateTime?
  completedAt     DateTime?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
  @@index([orderId])
  @@index([bookingId])
  @@index([assigneeId])
  @@index([assignedTo])
  @@index([status])
  @@index([priority])
}

model EmployeeSchedule {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeName    String
  employeeId      String?
  employeeRef     String?
  employee        Employee?       @relation(fields: [employeeRef], references: [id])
  date            DateTime        @db.Date
  shiftType       ShiftType       @default(MORNING)
  startTime       String
  endTime         String
  breakStart      String?
  breakEnd        String?
  isAbsent        Boolean         @default(false)
  absenceReason   String?
  isOnLeave       Boolean         @default(false)
  leaveType       String?
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([businessId, employeeName, date])
  @@index([businessId])
  @@index([employeeId])
  @@index([employeeRef])
  @@index([date])
  @@index([shiftType])
}

model PlanningLog {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  userId          String?
  user            User?           @relation(fields: [userId], references: [id])
  action          String
  entityType      String?
  entityId        String?
  description     String?
  metadata        Json?
  createdAt       DateTime        @default(now())

  @@index([businessId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ============================================
// EMPLOYEE MODELS (Module 11)
// ============================================

model Employee {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  firstName           String
  lastName            String
  photo               String?
  phone               String
  whatsapp            String?
  email               String?
  gender              String?
  address             String?
  city                String?
  country             String?
  position            String
  department          String?
  employeeRoleId      String?
  employeeRole        EmployeeRole?   @relation(fields: [employeeRoleId], references: [id])
  hireDate            DateTime?
  salary              Decimal?        @db.Decimal(12, 2)
  salaryCurrency      String          @default("FCFA")
  pinCode             String?
  isRegistered        Boolean         @default(false)
  userId              String?
  user                User?           @relation(fields: [userId], references: [id])
  status              EmployeeStatus  @default(ACTIVE)
  isActive            Boolean         @default(true)
  schedules           EmployeeSchedule[]
  attendances         Attendance[]
  documents           EmployeeDocument[]
  performances        EmployeePerformance[]
  activities          EmployeeActivity[]
  assignedTasks       PlanningTask[]  @relation("TaskAssignee")
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([businessId])
  @@index([status])
  @@index([department])
  @@index([userId])
}

model EmployeeRole {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  permissions         EmployeePermission[]
  isDefault           Boolean         @default(false)
  employees           Employee[]
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([businessId])
}

model Attendance {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  clockIn             DateTime
  clockOut            DateTime?
  method              AttendanceMethod @default(MANUAL)
  clockInLat          Float?
  clockInLng          Float?
  clockOutLat         Float?
  clockOutLng         Float?
  breakStart          DateTime?
  breakEnd            DateTime?
  totalBreakMinutes   Int?            @default(0)
  totalMinutes        Int?
  isLate              Boolean         @default(false)
  lateMinutes         Int?            @default(0)
  isOvertime          Boolean         @default(false)
  overtimeMinutes     Int?            @default(0)
  notes               String?
  isAbsent            Boolean         @default(false)
  absenceReason       String?
  createdAt           DateTime        @default(now())

  @@index([businessId])
  @@index([employeeId])
  @@index([clockIn])
}

model EmployeeDocument {
  id                  String                  @id @default(uuid())
  businessId          String
  business            Business                @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee                @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  type                EmployeeDocumentType
  title               String
  description         String?
  fileUrl             String
  fileSize            Int?
  mimeType            String?
  expiresAt           DateTime?
  isExpired           Boolean                 @default(false)
  expiryNotified      Boolean                 @default(false)
  verifiedAt          DateTime?
  verifiedBy          String?
  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  @@index([businessId])
  @@index([employeeId])
  @@index([expiresAt])
}

model EmployeePerformance {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  periodStart         DateTime
  periodEnd           DateTime
  punctuality         Int?            @default(0)
  tasksCompleted      Int?            @default(0)
  tasksAssigned       Int?            @default(0)
  salesGenerated      Decimal?        @db.Decimal(12, 2)
  clientSatisfaction  Int?            @default(0)
  efficiency          Int?            @default(0)
  rating              PerformanceRating?
  overallScore        Int?            @default(0)
  reviewNotes         String?
  reviewedBy          String?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([businessId])
  @@index([employeeId])
  @@index([periodStart, periodEnd])
}

model EmployeeActivity {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  action              String
  module              String?
  description         String?
  metadata            Json?
  ipAddress           String?
  createdAt           DateTime        @default(now())

  @@index([businessId])
  @@index([employeeId])
  @@index([createdAt])
  @@index([action])
}

// ============================================
// PROMOTION MODELS (Module 9)
// ============================================

model Promotion {
  id              String              @id @default(uuid())
  businessId      String
  business        Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  title           String
  description     String?
  promotionType   PromotionType       @default(PERCENTAGE)
  discountValue   Decimal             @db.Decimal(12, 2)
  code            String?
  targetType      PromotionTargetType @default(ALL)
  targetIds       String[]
  minOrderAmount  Decimal?            @db.Decimal(12, 2)
  maxUsageCount   Int?
  usageCount      Int                 @default(0)
  perCustomerLimit Int?
  conditions      Json?
  badgeLabel      String?
  image           String?
  bannerImage     String?
  autoApply       Boolean             @default(false)
  startsAt        DateTime?
  endsAt          DateTime?
  isActive        Boolean             @default(true)
  isFeatured      Boolean             @default(false)
  campaigns       MarketingCampaign[]
  coupons         Coupon[]
  logs            PromotionLog[]
  bundles         Bundle[]
  birthdayPrograms LoyaltyProgram[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
  @@index([code])
  @@index([promotionType])
  @@index([isActive, startsAt, endsAt])
}

model Coupon {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  promotionId     String?
  promotion       Promotion?      @relation(fields: [promotionId], references: [id])
  clientId        String?
  client          User?           @relation(fields: [clientId], references: [id])
  code            String          @unique
  discountType    String          @default("PERCENTAGE")
  discountValue   Decimal         @db.Decimal(12, 2)
  minOrderAmount  Decimal?        @db.Decimal(12, 2)
  maxUses         Int?            @default(1)
  useCount        Int             @default(0)
  isNewCustomer   Boolean         @default(false)
  isVipOnly       Boolean         @default(false)
  status          CouponStatus    @default(ACTIVE)
  expiresAt       DateTime?
  issuedAt        DateTime        @default(now())
  logs            PromotionLog[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([businessId])
  @@index([promotionId])
  @@index([clientId])
  @@index([code])
  @@index([status])
}

model Bundle {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  promotionId     String?
  promotion       Promotion?      @relation(fields: [promotionId], references: [id])
  name            String
  description     String?
  image           String?
  totalPrice      Decimal         @db.Decimal(12, 2)
  bundlePrice     Decimal         @db.Decimal(12, 2)
  savings         Decimal?        @db.Decimal(12, 2)
  isActive        Boolean         @default(true)
  items           BundleItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([businessId])
  @@index([promotionId])
}

model BundleItem {
  id          String    @id @default(uuid())
  bundleId    String
  bundle      Bundle    @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  itemType    String
  itemId      String
  quantity    Int       @default(1)
  createdAt   DateTime  @default(now())

  @@index([bundleId])
}

model MarketingCampaign {
  id              String            @id @default(uuid())
  businessId      String
  business        Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  promotionId     String?
  promotion       Promotion?        @relation(fields: [promotionId], references: [id])
  name            String
  description     String?
  channels        CampaignChannel[]
  message         String?
  image           String?
  targetAudience  String?
  scheduledAt     DateTime?
  sentAt          DateTime?
  status          CampaignStatus    @default(DRAFT)
  sentCount       Int               @default(0)
  openedCount     Int               @default(0)
  clickedCount    Int               @default(0)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([businessId])
  @@index([promotionId])
  @@index([status])
}

model PromotionLog {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  promotionId     String?
  promotion       Promotion?      @relation(fields: [promotionId], references: [id])
  couponId        String?
  coupon          Coupon?         @relation(fields: [couponId], references: [id])
  action          String
  description     String?
  metadata        Json?
  createdAt       DateTime        @default(now())

  @@index([businessId])
  @@index([promotionId])
  @@index([createdAt])
}

model LoyaltyProgram {
  id              String          @id @default(uuid())
  businessId      String          @unique
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  promotionId     String?
  promotion       Promotion?      @relation(fields: [promotionId], references: [id])
  name            String          @default("Programme Fidélité")
  description     String?
  pointsPerAmount Int?            @default(10)
  amountForPoints Decimal?        @default(1000) @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  tiers           LoyaltyTier[]
  birthdayBonus   Int?            @default(100)
  referralBonus   Int?            @default(50)
  isActive        Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model LoyaltyPoints {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  clientId        String
  client          User            @relation(fields: [clientId], references: [id])
  tier            LoyaltyTier     @default(BRONZE)
  totalPoints     Int             @default(0)
  lifetimePoints  Int             @default(0)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([businessId, clientId])
  @@index([businessId])
  @@index([clientId])
}

model LoyaltyTransaction {
  id              String          @id @default(uuid())
  loyaltyId       String
  loyalty         LoyaltyPoints   @relation(fields: [loyaltyId], references: [id], onDelete: Cascade)
  type            String          // EARNED, REDEEMED, EXPIRED, BONUS
  points          Int
  description     String?
  reference       String?
  createdAt       DateTime        @default(now())

  @@index([loyaltyId])
}

// ============================================
// PORTFOLIO MODELS (Module 12)
// ============================================

model PortfolioCategory {
  id            String          @id @default(uuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name          String
  slug          String
  description   String?
  icon          String?
  image         String?
  parentId      String?
  parent        PortfolioCategory? @relation("PortfolioCategoryTree", fields: [parentId], references: [id])
  children      PortfolioCategory[] @relation("PortfolioCategoryTree")
  sortOrder     Int             @default(0)
  isActive      Boolean         @default(true)
  items         PortfolioItem[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([businessId, slug])
  @@index([businessId])
  @@index([parentId])
}

model PortfolioItem {
  id            String          @id @default(uuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  categoryId    String?
  category      PortfolioCategory? @relation(fields: [categoryId], references: [id])
  title         String
  description   String?
  content       String?
  coverImage    String?
  images        String[]
  video         String?
  beforeImage   String?
  afterImage    String?
  clientName    String?
  location      String?
  budget        Decimal?        @db.Decimal(12, 2)
  currency      String          @default("FCFA")
  duration      String?
  resultsText   String?
  tags          String[]
  legacyCategory String?
  projectDate   DateTime?
  sortOrder     Int             @default(0)
  featured      Boolean         @default(false)
  isActive      Boolean         @default(true)
  likesCount    Int             @default(0)
  viewsCount    Int             @default(0)
  sharesCount   Int             @default(0)
  media         PortfolioMedia[]
  interactions  PortfolioInteraction[]
  testimonials  PortfolioTestimonial[] @relation("TestimonialItem")
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?

  @@index([businessId])
  @@index([categoryId])
  @@index([featured])
  @@index([sortOrder])
}

model PortfolioMedia {
  id            String            @id @default(uuid())
  portfolioItemId String
  portfolioItem  PortfolioItem    @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  type          PortfolioMediaType @default(IMAGE)
  url           String
  title         String?
  description   String?
  fileSize      Int?
  mimeType      String?
  width         Int?
  height        Int?
  sortOrder     Int               @default(0)
  isActive      Boolean           @default(true)
  createdAt     DateTime          @default(now())

  @@index([portfolioItemId])
  @@index([businessId])
}

model PortfolioInteraction {
  id            String                @id @default(uuid())
  portfolioItemId String
  portfolioItem  PortfolioItem        @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business              @relation(fields: [businessId], references: [id], onDelete: Cascade)
  type          PortfolioInteractionType
  visitorId     String?
  visitorName   String?
  comment       String?
  metadata      Json?
  createdAt     DateTime              @default(now())

  @@index([portfolioItemId])
  @@index([businessId])
  @@index([type])
}

model PortfolioTestimonial {
  id            String            @id @default(uuid())
  businessId    String
  business      Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  portfolioItemId String?
  portfolioItem  PortfolioItem?   @relation("TestimonialItem", fields: [portfolioItemId], references: [id])
  clientName    String
  clientPhoto   String?
  clientCompany String?
  text          String
  rating        Int?              @default(5)
  projectDate   DateTime?
  isPinned      Boolean           @default(false)
  isActive      Boolean           @default(true)
  sortOrder     Int               @default(0)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([businessId])
  @@index([portfolioItemId])
  @@index([isPinned])
}

// ============================================
// SUBSCRIPTION MODELS (Module 13)
// ============================================

model SubscriptionPlan {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  type            SubscriptionPlanType @default(STANDARD)
  price           Decimal         @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  billingCycle    BillingCycle    @default(MONTHLY)
  trialDays       Int?            @default(0)
  durationDays    Int?
  maxUsage        Int?
  maxClients      Int?
  maxBookings     Int?
  benefits        String[]
  privileges      SubscriptionPrivilege[]
  isPublic        Boolean         @default(true)
  isActive        Boolean         @default(true)
  sortOrder       Int             @default(0)
  featured        Boolean         @default(false)
  badge           String?
  subscribers     BusinessSubscription[]
  logs            SubscriptionLog[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([businessId])
  @@index([isActive])
  @@index([type])
}

model SubscriptionPrivilege {
  id              String          @id @default(uuid())
  planId          String
  plan            SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  code            String
  label           String
  description     String?
  value           Decimal?        @db.Decimal(12, 2)
  valueType       String?
  sortOrder       Int             @default(0)
  createdAt       DateTime        @default(now())

  @@index([planId])
}

model BusinessSubscription {
  id              String                    @id @default(uuid())
  businessId      String
  business        Business                  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  planId          String
  plan            SubscriptionPlan          @relation(fields: [planId], references: [id])
  clientId        String
  client          User                      @relation("ClientSubscriptions", fields: [clientId], references: [id], onDelete: Cascade)
  status          SubscriptionStatus        @default(ACTIVE)
  startDate       DateTime                  @default(now())
  endDate         DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  autoRenew       Boolean                   @default(true)
  renewalStatus   SubscriptionRenewalStatus?
  renewalCount    Int                       @default(0)
  lastRenewedAt   DateTime?
  nextBillingDate DateTime?
  payments        SubscriptionPayment[]
  logs            SubscriptionLog[]
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt

  @@index([businessId])
  @@index([planId])
  @@index([clientId])
  @@index([status])
  @@index([endDate])
}

model SubscriptionPayment {
  id              String          @id @default(uuid())
  subscriptionId  String
  subscription    BusinessSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  amount          Decimal         @db.Decimal(12, 2)
  currency        String          @default("FCFA")
  method          String
  status          String
  reference       String?
  notes           String?
  isManual        Boolean         @default(false)
  verifiedBy      String?
  verifiedAt      DateTime?
  periodStart     DateTime?
  periodEnd       DateTime?
  createdAt       DateTime        @default(now())

  @@index([subscriptionId])
  @@index([businessId])
  @@index([status])
}

model SubscriptionLog {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  planId          String?
  plan            SubscriptionPlan? @relation(fields: [planId], references: [id])
  subscriptionId  String?
  subscription    BusinessSubscription? @relation(fields: [subscriptionId], references: [id])
  action          String
  description     String?
  metadata        Json?
  performedBy     String?
  createdAt       DateTime        @default(now())

  @@index([businessId])
  @@index([subscriptionId])
  @@index([action])
  @@index([createdAt])
}

// ============================================
// DELIVERY MODELS (Module 14)
// ============================================

model Driver {
  id                String              @id @default(uuid())
  businessId        String
  business          Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name              String
  phone             String
  email             String?
  photo             String?
  vehicleType       DriverVehicleType   @default(MOTORCYCLE)
  vehicleModel      String?
  licensePlate      String?
  status            DriverStatus        @default(AVAILABLE)
  isActive          Boolean             @default(true)
  zones             String[]
  maxDistance       Int?
  totalDeliveries   Int                 @default(0)
  rating            Float               @default(0)
  onTimeRate        Int                 @default(0)
  deliveries        Delivery[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([businessId])
  @@index([status])
}

model Delivery {
  id                String              @id @default(uuid())
  businessId        String
  business          Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  orderId           String?
  order             Order?              @relation(fields: [orderId], references: [id])
  driverId          String?
  driver            Driver?             @relation(fields: [driverId], references: [id])
  zoneId            String?
  zone              DeliveryZone?       @relation(fields: [zoneId], references: [id])
  deliveryNumber    String              @unique
  type              DeliveryType        @default(STANDARD)
  status            DeliveryStatus      @default(PREPARING)
  scheduledAt       DateTime?
  pickedUpAt        DateTime?
  inTransitAt       DateTime?
  arrivedAt         DateTime?
  deliveredAt       DateTime?
  cancelledAt       DateTime?
  address           String
  city              String?
  latitude          Float?
  longitude         Float?
  deliveryInstructions String?
  zoneName          String?
  fee               Decimal             @default(0) @db.Decimal(12, 2)
  currency          String              @default("FCFA")
  estimatedMinutes  Int?
  actualMinutes     Int?
  distance          Float?
  recipientName     String?
  recipientPhone    String?
  otpCode           String?
  otpVerified       Boolean             @default(false)
  otpVerifiedAt     DateTime?
  signatureUrl      String?
  photoUrl          String?
  notes             String?
  tracking          DeliveryTracking[]
  proofs            DeliveryProof[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([businessId])
  @@index([orderId])
  @@index([driverId])
  @@index([status])
  @@index([deliveryNumber])
}

model DeliveryTracking {
  id                String              @id @default(uuid())
  deliveryId        String
  delivery          Delivery            @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  businessId        String
  business          Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  status            DeliveryStatus
  latitude          Float?
  longitude         Float?
  locationName      String?
  notes             String?
  recordedBy        String?
  createdAt         DateTime            @default(now())

  @@index([deliveryId])
  @@index([businessId])
  @@index([createdAt])
}

model DeliveryProof {
  id                String              @id @default(uuid())
  deliveryId        String
  delivery          Delivery            @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  businessId        String
  business          Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  type              String
  url               String?
  value             String?
  notes             String?
  verifiedBy        String?
  verifiedAt        DateTime?
  createdAt         DateTime            @default(now())

  @@index([deliveryId])
  @@index([businessId])
}

// ============================================
// ADVERTISING MODELS (AfriBiz Ads)
// ============================================

model AdPackage {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  description     String?
  advertiserType  AdvertiserType
  placements      String[]
  durationHours   Int
  price           Decimal  @db.Decimal(12, 2)
  currency        String   @default("FCFA")
  isActive        Boolean  @default(true)
  campaigns       AdCampaign[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([advertiserType])
  @@index([isActive])
}

model AdCampaign {
  id              String          @id @default(uuid())
  packageId       String?
  package         AdPackage?      @relation(fields: [packageId], references: [id])
  advertiserType  AdvertiserType
  businessId      String?
  business        Business?       @relation(fields: [businessId], references: [id])
  developerId     String?
  companyName     String?
  responsibleName String?
  phone           String?
  whatsapp        String?
  email           String?
  website         String?
  country         String?
  city            String?
  name            String
  objective       AdObjective     @default(PROMOTION)
  description     String?
  startDate       DateTime
  endDate         DateTime
  budget          Decimal?        @db.Decimal(12, 2)
  geoTarget       String[]
  status          AdStatus        @default(PENDING)
  validatedAt     DateTime?
  validatedBy     String?
  rejectionReason String?
  activatedAt     DateTime?
  completedAt     DateTime?
  suspendedAt     DateTime?
  suspendReason   String?
  creatives       AdCreative[]
  impressions     AdImpression[]
  clicks          AdClick[]
  conversions     AdConversion[]
  invoice         AdInvoice?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([advertiserType])
  @@index([status])
  @@index([startDate, endDate])
  @@index([businessId])
}

model AdCreative {
  id              String      @id @default(uuid())
  campaignId      String
  campaign        AdCampaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  placementPage   AdPlacementPage
  placementPosition AdPlacementPosition
  format          AdFormat
  mainImage       String?
  secondaryImages String[]
  banner          String?
  video           String?
  logo            String?
  adText          String?
  destinationUrl  String?
  cta             String?
  ctaColor        String?
  targetCountries String[]
  targetCities    String[]
  minRating       Float?
  impressions     Int         @default(0)
  clicks          Int         @default(0)
  conversions     Int         @default(0)
  spend           Decimal     @default(0) @db.Decimal(12, 2)
  isActive        Boolean     @default(true)
  sortOrder       Int         @default(0)
  creativeImpressions AdImpression[] @relation("CreativeImpressions")
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([campaignId])
  @@index([placementPage, placementPosition, isActive])
  @@index([format])
}

model AdImpression {
  id              String      @id @default(uuid())
  campaignId      String
  campaign        AdCampaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  creativeId      String?
  creative        AdCreative? @relation("CreativeImpressions", fields: [creativeId], references: [id])
  userId          String?
  ipAddress       String?
  userAgent       String?
  page            String
  position        String
  referrer        String?
  sessionId       String?
  clicks          AdClick[]
  cost            Decimal     @default(0) @db.Decimal(12, 2)
  createdAt       DateTime    @default(now())

  @@index([campaignId])
  @@index([creativeId])
  @@index([createdAt])
  @@index([page])
}

model AdClick {
  id              String      @id @default(uuid())
  campaignId      String
  campaign        AdCampaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  impressionId    String?
  impression      AdImpression? @relation(fields: [impressionId], references: [id])
  userId          String?
  ipAddress       String?
  userAgent       String?
  page            String
  position        String
  conversions     AdConversion[]
  cost            Decimal     @default(0) @db.Decimal(12, 2)
  createdAt       DateTime    @default(now())

  @@index([campaignId])
  @@index([impressionId])
  @@index([createdAt])
}

model AdConversion {
  id              String      @id @default(uuid())
  campaignId      String
  campaign        AdCampaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  clickId         String?
  click           AdClick?    @relation(fields: [clickId], references: [id])
  type            String
  value           Decimal?    @db.Decimal(12, 2)
  reference       String?
  userId          String?
  createdAt       DateTime    @default(now())

  @@index([campaignId])
  @@index([clickId])
  @@index([type])
}

model AdInvoice {
  id              String      @id @default(uuid())
  campaignId      String      @unique
  campaign        AdCampaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  number          String      @unique
  amount          Decimal     @db.Decimal(12, 2)
  currency        String      @default("FCFA")
  status          String      @default("PENDING")
  issuedAt        DateTime    @default(now())
  paidAt          DateTime?
  dueAt           DateTime?
  paymentMethod   String?
  paymentRef      String?
  lineItems       Json?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([campaignId])
  @@index([status])
  @@index([number])
}

// ============================================
// AFRISCORE MODELS
// ============================================

model BusinessScore {
  id              String        @id @default(uuid())
  businessId      String        @unique
  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  overallScore    Int           @default(0)
  commercialScore     Int       @default(0)
  financialScore      Int       @default(0)
  satisfactionScore   Int       @default(0)
  reliabilityScore    Int       @default(0)
  profileScore        Int       @default(0)
  category        ScoreCategory @default(VERY_LOW)
  totalOrders     Int           @default(0)
  totalBookings   Int           @default(0)
  totalSales      Int           @default(0)
  totalRevenue    Decimal       @default(0) @db.Decimal(14, 2)
  avgRating       Float         @default(0)
  reviewCount     Int           @default(0)
  completionPct   Float         @default(0)
  disputeCount    Int           @default(0)
  latePayments    Int           @default(0)
  computedAt      DateTime      @default(now())
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([businessId])
  @@index([overallScore])
  @@index([category])
}

model ScoreHistory {
  id              String        @id @default(uuid())
  businessId      String
  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  overallScore    Int
  commercialScore Int
  financialScore  Int
  satisfactionScore Int
  reliabilityScore  Int
  profileScore    Int
  category        ScoreCategory
  period          String
  snapshotDate    DateTime
  createdAt       DateTime      @default(now())

  @@index([businessId])
  @@index([businessId, period, snapshotDate])
  @@index([snapshotDate])
}

model BusinessBadge {
  id              String        @id @default(uuid())
  businessId      String
  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  badge           BadgeType
  label           String
  description     String?
  icon            String?
  isActive        Boolean       @default(true)
  earnedAt        DateTime      @default(now())
  expiresAt       DateTime?
  createdAt       DateTime      @default(now())

  @@unique([businessId, badge])
  @@index([businessId])
  @@index([badge])
}

model DataConsent {
  id              String        @id @default(uuid())
  businessId      String        @unique
  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  shareLevel      DataShareLevel @default(NONE)
  allowsBanks     Boolean       @default(false)
  allowsInsurance Boolean       @default(false)
  allowsInvestors Boolean       @default(false)
  allowsPublic    Boolean       @default(false)
  allowsAll       Boolean       @default(false)
  consentDate     DateTime      @default(now())
  revocationDate  DateTime?
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([businessId])
  @@index([isActive])
}

model DataPartner {
  id              String        @id @default(uuid())
  name            String
  slug            String        @unique
  type            PartnerType
  email           String
  phone           String?
  website         String?
  logo            String?
  description     String?
  apiKey          String        @unique
  apiEnabled      Boolean       @default(false)
  apiQuota        Int           @default(1000)
  apiUsed         Int           @default(0)
  isActive        Boolean       @default(true)
  approvedAt      DateTime?
  approvedBy      String?
  subscriptions   PartnerSubscription[]
  reports         DataReport[]
  accessLogs      DataAccessLog[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([type])
  @@index([isActive])
}

model PartnerSubscription {
  id              String              @id @default(uuid())
  partnerId       String
  partner         DataPartner         @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  plan            String
  price           Decimal             @db.Decimal(12, 2)
  currency        String              @default("FCFA")
  startsAt        DateTime
  expiresAt       DateTime?
  status          SubscriptionStatus  @default(ACTIVE)
  autoRenew       Boolean             @default(true)
  cancelledAt     DateTime?
  maxReports      Int                 @default(50)
  maxApiCalls     Int                 @default(1000)
  features        String[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([partnerId])
  @@index([status])
}

model DataReport {
  id              String        @id @default(uuid())
  partnerId       String?
  partner         DataPartner?  @relation(fields: [partnerId], references: [id])
  type            ReportType
  status          ReportStatus  @default(GENERATING)
  title           String
  description     String?
  businessId      String?
  sector          String?
  country         String?
  city            String?
  periodStart     DateTime?
  periodEnd       DateTime?
  data            Json?
  summary         String?
  fileUrl         String?
  price           Decimal       @default(0) @db.Decimal(12, 2)
  currency        String        @default("FCFA")
  isPaid          Boolean       @default(false)
  paidAt          DateTime?
  accessLogs      DataAccessLog[]
  downloadedAt    DateTime?
  downloadCount   Int           @default(0)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([partnerId])
  @@index([type])
  @@index([status])
  @@index([businessId])
  @@index([sector])
}

model DataAccessLog {
  id              String        @id @default(uuid())
  partnerId       String
  partner         DataPartner   @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  action          String
  businessId      String?
  business        Business?     @relation(fields: [businessId], references: [id])
  reportId        String?
  report          DataReport?   @relation(fields: [reportId], references: [id])
  ipAddress       String?
  userAgent       String?
  details         Json?
  createdAt       DateTime      @default(now())

  @@index([partnerId])
  @@index([businessId])
  @@index([action])
  @@index([createdAt])
}

model SectorBenchmark {
  id              String        @id @default(uuid())
  sector          String        @unique
  avgScore        Float         @default(0)
  avgCommercial   Float         @default(0)
  avgFinancial    Float         @default(0)
  avgSatisfaction Float         @default(0)
  avgReliability  Float         @default(0)
  avgProfile      Float         @default(0)
  businessCount   Int           @default(0)
  computedAt      DateTime      @default(now())
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([sector])
  @@index([avgScore])
}

// ============================================
// DEVELOPER MODELS
// ============================================

model DeveloperProfile {
  id                  String    @id @default(uuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyName         String?
  description         String?
  logo                String?
  website             String?
  phone               String?
  email               String?
  country             String?
  city                String?
  skills              String[]
  experience          Int?
  portfolio           String?
  isActive            Boolean   @default(true)
  isVerified          Boolean   @default(false)
  modules             DeveloperModule[]
  moduleInstallations DeveloperModuleInstallation[]
  moduleReviews       DeveloperModuleReview[]
  supportTickets      DeveloperSupportTicket[]
  supportMessages      DeveloperSupportMessage[]
  adCampaigns         AdCampaign[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([userId])
}

model DeveloperModule {
  id                  String    @id @default(uuid())
  developerId         String
  developer           DeveloperProfile @relation(fields: [developerId], references: [id], onDelete: Cascade)
  name                String
  slug                String    @unique
  description         String?
  shortDescription    String?
  logo                String?
  images              String[]
  price               Decimal?  @db.Decimal(12, 2)
  currency            String    @default("FCFA")
  isFree              Boolean   @default(false)
  isActive            Boolean   @default(true)
  isPublished         Boolean   @default(false)
  isFeatured          Boolean   @default(false)
  category            String?
  tags                String[]
  features            String[]
  requirements        String?
  setupGuide          String?
  version             String    @default("1.0.0")
  rating              Float     @default(0)
  reviewCount         Int       @default(0)
  installCount        Int       @default(0)
  installations       DeveloperModuleInstallation[]
  reviews             DeveloperModuleReview[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([developerId])
  @@index([slug])
  @@index([isPublished])
  @@index([category])
}

model DeveloperModuleInstallation {
  id                  String    @id @default(uuid())
  moduleId            String
  module              DeveloperModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  businessId          String
  business            Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  status              String    @default("ACTIVE")
  installedAt         DateTime  @default(now())
  uninstalledAt       DateTime?
  settings            Json?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([moduleId])
  @@index([businessId])
}

model DeveloperModuleReview {
  id                  String    @id @default(uuid())
  moduleId            String
  module              DeveloperModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  rating              Int       @default(5)
  title               String?
  comment             String?
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([moduleId])
  @@index([userId])
}

model DeveloperSupportTicket {
  id                  String    @id @default(uuid())
  developerId         String
  developer           DeveloperProfile @relation(fields: [developerId], references: [id], onDelete: Cascade)
  businessId          String
  business            Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  moduleId            String?
  module              DeveloperModule? @relation(fields: [moduleId], references: [id])
  subject             String
  description         String?
  priority            String    @default("MEDIUM")
  status              String    @default("OPEN")
  messages            DeveloperSupportMessage[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([developerId])
  @@index([businessId])
  @@index([status])
}

model DeveloperSupportMessage {
  id                  String    @id @default(uuid())
  ticketId            String
  ticket              DeveloperSupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  senderId            String
  sender              User      @relation(fields: [senderId], references: [id])
  content             String
  attachment          String?
  createdAt           DateTime  @default(now())

  @@index([ticketId])
  @@index([senderId])
}
`;

fs.writeFileSync('backend/prisma/schema.prisma', schema, 'utf-8');
console.log('✅ Complete schema rebuilt!');
console.log('Size:', Buffer.byteLength(schema, 'utf-8'), 'bytes');
console.log('Models:', (schema.match(/^model \w+/gm) || []).length);

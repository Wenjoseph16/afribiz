const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', '..', 'backend', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf-8');

// 1) Add new enums after FinancialLogAction
const enumMarker = 'MANUAL_ADJUSTMENT\n}\n\nenum BookingType';
const newEnums = `MANUAL_ADJUSTMENT
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
  PAUSED
  COMPLETED
  CANCELLED
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

enum CampaignChannel {
  WHATSAPP
  FACEBOOK
  INSTAGRAM
  PUSH
  EMAIL
  SMS
}

enum BookingType`;

content = content.replace(enumMarker, newEnums);
console.log('1) Added new enums');

// 2) Replace old Promotion model with enriched one
const oldPromo = `model Promotion {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  title       String
  description String?
  discountType String   // PERCENTAGE, FIXED
  discountValue Decimal  @db.Decimal(12, 2)
  code        String?
  startsAt    DateTime?
  endsAt      DateTime?
  isActive    Boolean   @default(true)
  image       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([businessId])
}`;

const newPromo = `model Promotion {
  id              String              @id @default(uuid())
  businessId      String
  business        Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // Core
  title           String
  description     String?
  promotionType   PromotionType       @default(PERCENTAGE)
  discountValue   Decimal             @db.Decimal(12, 2)
  code            String?

  // Targeting
  targetType      PromotionTargetType @default(ALL)
  targetIds       String[]            // Which products/services/rooms are targeted

  // Conditions
  minOrderAmount  Decimal?            @db.Decimal(12, 2)
  maxUsageCount   Int?                // Maximum number of uses
  usageCount      Int                 @default(0)
  perCustomerLimit Int?               // Max uses per customer
  conditions      Json?               // Complex conditions (JSON)

  // Display
  badgeLabel      String?             // Display label: Promo, Flash Sale, Nouveau, Top Vente
  image           String?
  bannerImage     String?
  autoApply       Boolean             @default(false)

  // Schedule
  startsAt        DateTime?
  endsAt          DateTime?

  // Status
  isActive        Boolean             @default(true)
  isFeatured      Boolean             @default(false)

  // Relations
  coupons         Coupon[]
  logs            PromotionLog[]
  bundles         Bundle[]

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  deletedAt       DateTime?

  @@index([businessId])
  @@index([code])
  @@index([promotionType])
  @@index([isActive, startsAt, endsAt])
}`;

if (!content.includes(newPromo.substring(0, 100))) {
  content = content.replace(oldPromo, newPromo);
  console.log('2) Replaced old Promotion model');
} else {
  console.log('2) Promotion model already updated, skipping');
}

// 3) Add new models before Partner model
const newModels = `

model Coupon {
  id            String        @id @default(uuid())
  promotionId   String?
  promotion     Promotion?    @relation(fields: [promotionId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  clientId      String?
  client        User?         @relation(fields: [clientId], references: [id])

  // Coupon info
  code          String        @unique
  status        CouponStatus  @default(ACTIVE)
  discountValue Decimal?      @db.Decimal(12, 2)
  discountType  String?

  // Usage
  usedAt        DateTime?
  usedBy        String?
  usageCount    Int           @default(0)
  maxUses       Int           @default(1)

  // Conditions
  minOrderAmount Decimal?     @db.Decimal(12, 2)
  newCustomerOnly Boolean     @default(false)
  vipOnly        Boolean      @default(false)

  // Expiration
  expiresAt     DateTime?
  issuedAt      DateTime      @default(now())

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([businessId])
  @@index([code])
  @@index([clientId])
  @@index([status])
}

model Bundle {
  id            String      @id @default(uuid())
  promotionId   String?
  promotion     Promotion?  @relation(fields: [promotionId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)

  name          String
  description   String?
  originalPrice Decimal     @db.Decimal(12, 2)
  bundlePrice   Decimal     @db.Decimal(12, 2)
  savings       Decimal     @db.Decimal(12, 2)
  isActive      Boolean     @default(true)
  image         String?

  items         BundleItem[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  @@index([businessId])
  @@index([promotionId])
}

model BundleItem {
  id            String    @id @default(uuid())
  bundleId      String
  bundle        Bundle    @relation(fields: [bundleId], references: [id], onDelete: Cascade)

  productId     String?
  serviceId     String?
  menuItemId    String?
  name          String
  quantity      Int       @default(1)
  unitPrice     Decimal   @db.Decimal(12, 2)

  createdAt     DateTime  @default(now())

  @@index([bundleId])
  @@index([productId])
}

model MarketingCampaign {
  id            String            @id @default(uuid())
  businessId    String
  business      Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  promotionId   String?
  promotion     Promotion?        @relation(fields: [promotionId], references: [id])

  name          String
  description   String?
  status        CampaignStatus    @default(DRAFT)
  channels      CampaignChannel[]

  targetAudience String?
  targetIds     String[]

  scheduledAt   DateTime?
  sentAt        DateTime?
  completedAt   DateTime?

  recipientsCount Int             @default(0)
  openedCount     Int             @default(0)
  clickedCount    Int             @default(0)
  conversionCount Int             @default(0)

  message       String?
  imageUrl      String?
  linkUrl       String?

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([businessId])
  @@index([promotionId])
  @@index([status])
}

model PromotionLog {
  id            String    @id @default(uuid())
  promotionId   String?
  promotion     Promotion? @relation(fields: [promotionId], references: [id], onDelete: Cascade)
  couponId      String?
  coupon        Coupon?   @relation(fields: [couponId], references: [id])
  businessId    String?
  business      Business? @relation(fields: [businessId], references: [id])

  action        String    // APPLIED, USED, EXPIRED, DISABLED, REDEEMED
  clientId      String?
  clientPhone   String?
  orderId       String?
  discountAmount Decimal? @db.Decimal(12, 2)
  metadata      Json?

  createdAt     DateTime  @default(now())

  @@index([promotionId])
  @@index([couponId])
  @@index([clientId])
  @@index([createdAt])
}

model LoyaltyProgram {
  id            String      @id @default(uuid())
  businessId    String      @unique
  business      Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)

  isActive      Boolean     @default(true)
  pointsPerAmount Decimal   @default(1) @db.Decimal(12, 2)
  pointsValue   Decimal     @default(1) @db.Decimal(12, 2)
  expiryDays    Int         @default(365)
  autoEnroll    Boolean     @default(true)

  tiers         LoyaltyTier[] @default([BRONZE, SILVER, GOLD, PLATINUM])
  bronzeMinPoints Int       @default(0)
  silverMinPoints Int       @default(100)
  goldMinPoints   Int       @default(500)
  platinumMinPoints Int     @default(1000)

  cashbackPercent Decimal   @default(0) @db.Decimal(5, 2)

  birthdayBonus  Int        @default(50)
  birthdayPromoId String?
  birthdayPromo  Promotion? @relation(fields: [birthdayPromoId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([businessId])
}

model LoyaltyPoints {
  id            String      @id @default(uuid())
  businessId    String?
  business      Business?   @relation(fields: [businessId], references: [id])
  clientId      String?
  client        User?       @relation(fields: [clientId], references: [id])
  clientPhone   String?

  points        Int         @default(0)
  lifetimePoints Int        @default(0)
  tier          LoyaltyTier @default(BRONZE)
  lastEarnedAt  DateTime?
  lastRedeemedAt DateTime?
  expiresAt     DateTime?

  transactions  LoyaltyTransaction[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([businessId, clientId])
  @@index([businessId])
  @@index([clientId])
  @@index([tier])
}

model LoyaltyTransaction {
  id            String      @id @default(uuid())
  loyaltyId     String
  loyalty       LoyaltyPoints @relation(fields: [loyaltyId], references: [id], onDelete: Cascade)

  type          String      // EARN, REDEEM, EXPIRY, ADJUSTMENT, BIRTHDAY
  points        Int
  description   String?
  orderId       String?
  reference     String?

  createdAt     DateTime    @default(now())

  @@index([loyaltyId])
  @@index([type])
  @@index([createdAt])
}

model Partner {`;

content = content.replace('model Partner {', newModels);
console.log('3) Added new models before Partner model');

// 4) Add relations to Business model
content = content.replace(
  '  planningTasks     PlanningTask[]',
  '  planningTasks     PlanningTask[]\n  promotions       Promotion[]\n  coupons          Coupon[]\n  bundles          Bundle[]\n  campaigns        MarketingCampaign[]\n  promotionLogs    PromotionLog[]\n  loyaltyProgram   LoyaltyProgram?\n  loyalties        LoyaltyPoints[]'
);
console.log('4) Added relations to Business model');

fs.writeFileSync(schemaPath, content, 'utf-8');
console.log('Schema written successfully');

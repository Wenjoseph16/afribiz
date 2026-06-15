const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', '..', 'backend', 'prisma', 'schema.prisma');
let c = fs.readFileSync(schemaPath, 'utf-8');

// The old Promotion model text (exact from the file)
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
  targetIds       String[]

  // Conditions
  minOrderAmount  Decimal?            @db.Decimal(12, 2)
  maxUsageCount   Int?
  usageCount      Int                 @default(0)
  perCustomerLimit Int?
  conditions      Json?

  // Display
  badgeLabel      String?
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
}`;

if (c.includes(oldPromo)) {
  c = c.replace(oldPromo, newPromo);
  console.log('Replaced old Promotion model with enriched one');
} else {
  console.log('ERROR: Could not find old Promotion model. Checking available text...');
  // Show what's around the model for debugging
  const idx = c.indexOf('model Promotion');
  if (idx >= 0) {
    console.log('Found at index ' + idx + ':');
    console.log(c.substring(idx, idx + 800));
  }
}

// Check if Coupon model already has opposite relations in Promotion
const promoEnd = c.indexOf('model Coupon');
if (promoEnd > 0) {
  // Check the section from Promotion start to Coupon
  const promoSection = c.substring(c.lastIndexOf('model Promotion', promoEnd), promoEnd);
  if (promoSection.includes('campaigns') && promoSection.includes('coupons')) {
    console.log('Promotion already has relation fields - good');
  }
}

fs.writeFileSync(schemaPath, c, 'utf-8');
console.log('Schema saved');

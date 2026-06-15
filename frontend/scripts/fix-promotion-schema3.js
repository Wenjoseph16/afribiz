const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', '..', 'backend', 'prisma', 'schema.prisma');
let c = fs.readFileSync(schemaPath, 'utf-8');

// Use regex to find and replace the old Promotion model
// This handles both \r\n and \n line endings
const oldPromoRegex = /model Promotion \{\r?\n\s+id\s+String\s+@id @default\(uuid\(\)\)[\s\S]*?@@index\(\[businessId\]\)\r?\n\}/;

const newPromoText = `model Promotion {
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

if (oldPromoRegex.test(c)) {
  c = c.replace(oldPromoRegex, newPromoText);
  console.log('Replaced old Promotion model');
} else {
  console.log('ERROR: Could not find old Promotion model with regex');
  // Debug: show what's around "model Promotion"
  const idx = c.indexOf('model Promotion');
  if (idx >= 0) {
    const snippet = c.substring(idx, idx + 600);
    console.log('Found at index ' + idx + ':');
    console.log(JSON.stringify(snippet));
  }
}

// Add opposite relations to User model for coupons and loyalties
// Check if already exists
if (!c.includes('coupons             Coupon[]') && !c.includes('coupons           Coupon[]')) {
  c = c.replace(
    '  planningLogs        PlanningLog[]\n  quotes',
    '  planningLogs        PlanningLog[]\n  coupons             Coupon[]\n  loyalties           LoyaltyPoints[]\n  quotes'
  );
  console.log('Added coupons and loyalties to User');
}

// Check if Promotion model now has the relations by looking for Coupon model references
if (!c.includes('coupons         Coupon[]')) {
  // The replace didn't work because of encoding, try inserting directly
  const couPonModelPos = c.indexOf('model Coupon {');
  if (couPonModelPos > 0) {
    // Find the end of Promotion model (right before Coupon model)
    const oldPromoStart = c.lastIndexOf('model Promotion', couPonModelPos);
    if (oldPromoStart >= 0) {
      // Read the existing Promotion model
      let oldPromoContent = c.substring(oldPromoStart, couPonModelPos);
      // Add relations to it
      if (!oldPromoContent.includes('coupons')) {
        // Replace the end of the model
        oldPromoContent = oldPromoContent.replace(
          /isActive.*\r?\n/,
          'isActive        Boolean             @default(true)\n  isFeatured      Boolean             @default(false)\n\n  // Relations\n  campaigns       MarketingCampaign[]\n  coupons         Coupon[]\n  logs            PromotionLog[]\n  bundles         Bundle[]\n  birthdayPrograms LoyaltyProgram[]\n'
        );
        c = c.substring(0, oldPromoStart) + oldPromoContent + c.substring(couPonModelPos);
        console.log('Inserted relations into Promotion model');
      }
    }
  }
}

fs.writeFileSync(schemaPath, c, 'utf-8');
console.log('Saved');

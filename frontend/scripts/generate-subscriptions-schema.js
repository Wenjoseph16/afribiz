const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ===== 1. Add new enums =====
// Insert after the existing SubscriptionStatus enum
const statusEnd = c.indexOf('enum SubscriptionStatus {');
const statusClose = c.indexOf('}', statusEnd);
const afterEnum = c.indexOf('\n\n', statusClose + 1);

const newEnums = `

// ==================== SUBSCRIPTION ENUMS (Module 13) ====================
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

`;

c = c.slice(0, afterEnum + 1) + newEnums + c.slice(afterEnum + 1);

// ===== 2. Add new models before first DataReport model =====
// Insert before model DataReport (after PartnerSubscription)
const dataReportPos = c.indexOf('\nmodel DataReport');
// We'll insert after PartnerSubscription's closing brace
const partnerSubEnd = c.indexOf('model DataReport {');
// Find the end of PartnerSubscription section (blank line before DataReport)
const insertPos = c.lastIndexOf('\n\n', partnerSubEnd);

const newModels = `

// ==================== SUBSCRIPTION MANAGEMENT (Module 13) ====================

model SubscriptionPlan {
  id              String          @id @default(uuid())
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)

  name            String
  description     String?
  type            SubscriptionPlanType @default(STANDARD)

  // Pricing
  price           Decimal         @db.Decimal(12, 2)
  currency         String          @default("FCFA")
  billingCycle    BillingCycle    @default(MONTHLY)
  trialDays       Int?            @default(0)

  // Duration & usage
  durationDays    Int?            // null = unlimited
  maxUsage        Int?            // null = unlimited (number of uses)
  maxClients      Int?            // null = unlimited
  maxBookings     Int?

  // Benefits
  benefits        String[]        // List of benefit descriptions
  privileges      SubscriptionPrivilege[]

  // Visibility
  isPublic        Boolean         @default(true)
  isActive        Boolean         @default(true)
  sortOrder       Int             @default(0)
  featured        Boolean         @default(false)
  badge           String?         // "POPULAIRE", "MEILLEUR RAPPORT", "ÉCONOMIE"

  // Relations
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

  code            String          // DISCOUNT_10, FREE_DELIVERY, PRIORITY_BOOKING, VIP_ACCESS, etc.
  label           String          // Human-readable label
  description     String?
  value           Decimal?        @db.Decimal(12, 2) // Discount value if applicable
  valueType       String?         // PERCENTAGE, FIXED_AMOUNT, FREE

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

  // Core
  status          SubscriptionStatus        @default(ACTIVE)
  startDate       DateTime                  @default(now())
  endDate         DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  autoRenew       Boolean                   @default(true)

  // Renewal tracking
  renewalStatus   SubscriptionRenewalStatus?
  renewalCount    Int                       @default(0)
  lastRenewedAt   DateTime?
  nextBillingDate DateTime?

  // Relations
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
  method          String          // CASH, MOBILE_MONEY, BANK, CARD, MANUAL
  status          String          // PENDING, COMPLETED, FAILED, REFUNDED
  reference       String?         // Transaction reference
  notes           String?
  isManual        Boolean         @default(false)
  verifiedBy      String?
  verifiedAt      DateTime?

  periodStart     DateTime?       // Billing period start
  periodEnd       DateTime?       // Billing period end

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

  action          String          // CREATED, ACTIVATED, RENEWED, CANCELLED, EXPIRED, PAYMENT_RECEIVED, PLAN_CHANGED
  description     String?
  metadata        Json?
  performedBy     String?         // User ID who performed the action

  createdAt       DateTime        @default(now())

  @@index([businessId])
  @@index([subscriptionId])
  @@index([action])
  @@index([createdAt])
}

`;

c = c.slice(0, insertPos) + newModels + c.slice(insertPos);

// ===== 3. Add relations to Business model =====
// Find business relations that are before the closing brace
c = c.replace(
  '  loyalties        LoyaltyPoints[]\n  planningLogs      PlanningLog[]',
  '  loyalties        LoyaltyPoints[]\n  subscriptionPlans   SubscriptionPlan[]\n  subscriptionSubs    BusinessSubscription[]\n  subscriptionPayments SubscriptionPayment[]\n  subscriptionLogs    SubscriptionLog[]\n  planningLogs      PlanningLog[]'
);

// ===== 4. Add relation to User model for client subscriptions =====
c = c.replace(
  '  employees           Employee[]',
  '  clientSubscriptions  BusinessSubscription[] @relation("ClientSubscriptions")\n  employees           Employee[]'
);

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Subscriptions schema updated successfully');

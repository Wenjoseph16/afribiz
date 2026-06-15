const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ===== 1. Add new enums =====
// Find the employee enums section and add after performance rating
const perfRatingEnd = c.indexOf('enum PerformanceRating {');
const perfClose = c.indexOf('}', perfRatingEnd);
const afterEnum = c.indexOf('\n\n', perfClose + 1);

const newEnums = `

// ==================== DELIVERY ENUMS (Module 14) ====================
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

`;

c = c.slice(0, afterEnum + 1) + newEnums + c.slice(afterEnum + 1);

// ===== 2. Add new models before SubscriptionPlan =====
// The DeliveryZone model is at line 760 - we need to add after the existing models
// Let's find a good insertion point - after DeliveryZone model, before PortfolioCategory
const delZoneEnd = c.indexOf('model DeliveryZone {');
// Find the end of DeliveryZone
let depth = 0;
let pos = delZoneEnd;
while (pos < c.length) {
  if (c[pos] === '{') depth++;
  if (c[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
  pos++;
}
// Find the blank line after DeliveryZone
const afterDelZone = c.indexOf('\n\n', pos);

const newModels = `

// ==================== DELIVERY MANAGEMENT (Module 14) ====================

model Driver {
  id                String              @id @default(uuid())
  businessId        String
  business          Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // Identity
  name              String
  phone             String
  email             String?
  photo             String?

  // Vehicle
  vehicleType       DriverVehicleType   @default(MOTORCYCLE)
  vehicleModel      String?
  licensePlate      String?

  // Status
  status            DriverStatus        @default(AVAILABLE)
  isActive          Boolean             @default(true)

  // Coverage
  zones             String[]            // Zone names this driver covers
  maxDistance       Int?                // Max distance in km

  // Performance
  totalDeliveries   Int                 @default(0)
  rating            Float               @default(0)
  onTimeRate        Int                 @default(0)     // 0-100

  // Relations
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

  // Core
  deliveryNumber    String              @unique
  type              DeliveryType        @default(STANDARD)
  status            DeliveryStatus      @default(PREPARING)

  // Dates
  scheduledAt       DateTime?
  pickedUpAt        DateTime?
  inTransitAt       DateTime?
  arrivedAt         DateTime?
  deliveredAt       DateTime?
  cancelledAt       DateTime?

  // Address
  address           String
  city              String?
  latitude          Float?
  longitude         Float?
  deliveryInstructions String?

  // Zone
  zoneId            String?
  zone              DeliveryZone?       @relation(fields: [zoneId], references: [id])
  zoneName          String?

  // Fees & timing
  fee               Decimal             @default(0) @db.Decimal(12, 2)
  currency          String              @default("FCFA")
  estimatedMinutes  Int?
  actualMinutes     Int?
  distance          Float?              // Km

  // Contact
  recipientName     String?
  recipientPhone    String?

  // Proof
  otpCode           String?             // OTP for delivery verification
  otpVerified       Boolean             @default(false)
  otpVerifiedAt     DateTime?
  signatureUrl      String?
  photoUrl          String?
  notes             String?

  // Relations
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
  recordedBy        String?             // Driver ID or system

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

  type              String              // PHOTO, SIGNATURE, OTP, MANUAL
  url               String?             // File URL for photo/signature
  value             String?             // OTP value or confirmation code
  notes             String?
  verifiedBy        String?             // Who verified
  verifiedAt        DateTime?

  createdAt         DateTime            @default(now())

  @@index([deliveryId])
  @@index([businessId])
}

`;

c = c.slice(0, afterDelZone + 1) + newModels + c.slice(afterDelZone + 1);

// ===== 3. Add relations to Business model =====
c = c.replace(
  '  employeeSchedules EmployeeSchedule[]',
  '  drivers           Driver[]\n  deliveries        Delivery[]\n  deliveryTracking   DeliveryTracking[]\n  deliveryProofs     DeliveryProof[]\n  employeeSchedules EmployeeSchedule[]'
);

// ===== 4. Add deliveryNumber field to DeliveryZone =====
// Already has the right fields

// ===== 5. Add delivery relation to Order model =====
// Check if Order model already has a delivery field
const orderModelIdx = c.indexOf('model Order {');
const orderSection = c.substring(orderModelIdx, orderModelIdx + 2000);
if (!orderSection.includes('delivery')) {
  // Add deliveryId and delivery relation near the end of Order model
  c = c.replace(
    '  planningTasks   PlanningTask[]',
    '  delivery         Delivery?\n  planningTasks   PlanningTask[]'
  );
}

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Delivery schema updated successfully');

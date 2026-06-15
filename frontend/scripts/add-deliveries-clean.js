const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ===== 1. Insert Delivery models after DeliveryZone =====
const dzEnd = c.indexOf('model DeliveryZone {');
let depth = 0;
let pos = dzEnd;
while (pos < c.length) {
  if (c[pos] === '{') depth++;
  if (c[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
  pos++;
}
// Find the blank line(s) after DeliveryZone closing
let insertPos = pos;
while (insertPos < c.length && (c[insertPos] === '\r' || c[insertPos] === '\n')) insertPos++;

const deliveryModels = `

// ==================== DELIVERY MANAGEMENT (Module 14) ====================

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

`;

c = c.slice(0, insertPos) + deliveryModels + c.slice(insertPos);

// ===== 2. Add relations to Business model =====
c = c.replace(
  'employeeSchedules EmployeeSchedule[]',
  'drivers           Driver[]\n  deliveries        Delivery[]\n  deliveryTracking   DeliveryTracking[]\n  deliveryProofs     DeliveryProof[]\n  employeeSchedules EmployeeSchedule[]'
);

// ===== 3. Fix: Remove any duplicate delivery relations if they exist =====
// The replacement might have been applied before - check for duplicates
const driverCount = (c.match(/drivers/g) || []).length;
if (driverCount > 1) {
  // Remove the second set
  c = c.replace(
    '  deliveryProofs     DeliveryProof[]\n  drivers           Driver[]\n  deliveries        Delivery[]\n  deliveryTracking   DeliveryTracking[]\n  deliveryProofs     DeliveryProof[]',
    '  deliveryProofs     DeliveryProof[]'
  );
}

// ===== 4. Add delivery relation to Order model =====
c = c.replace(
  'planningTasks   PlanningTask[]',
  'delivery         Delivery?\n  planningTasks   PlanningTask[]'
);

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('Delivery schema updated successfully');

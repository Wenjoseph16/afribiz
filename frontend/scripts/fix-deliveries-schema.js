const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// 1) Remove badly inserted models if still present
const delComment = '// ==================== DELIVERY MANAGEMENT (Module 14) ====================';
if (c.includes(delComment)) {
  const start = c.indexOf(delComment);
  // Find next model declaration
  const nextModels = ['\nmodel Order {', '\nmodel SubscriptionPlan', '\nmodel PortfolioItem', '\nmodel Employee {'];
  let end = c.length;
  for (const m of nextModels) {
    const idx = c.indexOf(m, start + 10);
    if (idx > start && idx < end) end = idx;
  }
  c = c.substring(0, start) + '\n' + c.substring(end);
  console.log('Removed bad insertion');
}

// 2) Find correct insertion point - after DeliveryZone model
const dzIdx = c.indexOf('\nmodel DeliveryZone {');
let depth = 0;
let pos = dzIdx;
while (pos < c.length) {
  if (c[pos] === '{') depth++;
  if (c[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
  pos++;
}
// Find the next model after DeliveryZone
const nextModel = c.indexOf('\nmodel ', pos + 1);
const insertPos = c.lastIndexOf('\n', nextModel - 1); // end of blank line before next model

console.log('DeliveryZone ends at char:', pos);
console.log('Next model at char:', nextModel);
console.log('Insert position:', insertPos);

// 3) Build the new models
const newModels = `

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

// 4) Insert at correct position
c = c.slice(0, insertPos + 1) + newModels + c.slice(insertPos + 1);

// 5) Add relations to Business model
c = c.replace(
  '  employeeSchedules EmployeeSchedule[]',
  '  drivers           Driver[]\n  deliveries        Delivery[]\n  deliveryTracking   DeliveryTracking[]\n  deliveryProofs     DeliveryProof[]\n  employeeSchedules EmployeeSchedule[]'
);

// 6) Add delivery relation to Order model
c = c.replace(
  '  planningTasks   PlanningTask[]',
  '  delivery         Delivery?\n  planningTasks   PlanningTask[]'
);

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Delivery schema fixed');

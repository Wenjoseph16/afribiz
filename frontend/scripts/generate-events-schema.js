const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ============================================
// 1. Add new enums AFTER Event model area
// ============================================

// Find where to insert enums - before the Event model
const eventModelIdx = c.indexOf('model Event {');

// Find the line before model Event to insert enums
const beforeEvent = c.lastIndexOf('\n', eventModelIdx - 2);
const enumBlock = `
// ============================================
// EVENT ENUMS (Module 15)
// ============================================

enum EventType {
  CONCERT
  PARTY
  CONFERENCE
  WORKSHOP
  FESTIVAL
  TOURNAMENT
  NETWORKING
  WEBINAR
  EXHIBITION
  PRIVATE
  VIP
  LAUNCH
  PROMOTION
  OTHER
}

enum EventLocationType {
  PHYSICAL
  ONLINE
  HYBRID
}

enum TicketType {
  FREE
  STANDARD
  PREMIUM
  VIP
  TABLE
}

enum ParticipantStatus {
  REGISTERED
  CONFIRMED
  CHECKED_IN
  NO_SHOW
  CANCELLED
  REFUNDED
}

enum TicketSaleStatus {
  ACTIVE
  PAUSED
  SOLD_OUT
  ENDED
}

`;

// Insert enums before the Event model
c = c.substring(0, beforeEvent) + '\n' + enumBlock + c.substring(beforeEvent).trimStart();

// ============================================
// 2. Replace the existing Event model with enriched version
// ============================================

const oldEventModel = `model Event {
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
}`;

const newEventModel = `model Event {
  id              String            @id @default(uuid())
  businessId      String
  business        Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // General info
  title           String
  shortDescription String?
  description     String?
  type            EventType         @default(OTHER)
  locationType    EventLocationType @default(PHYSICAL)
  
  // Media
  coverImage      String?
  images          String[]
  videos          String[]
  
  // Date & Time
  startDate       DateTime
  endDate         DateTime?
  startTime       String?
  endTime         String?
  timezone        String            @default("Africa/Abidjan")
  
  // Location (physical)
  address         String?
  city            String?
  country         String?
  latitude        Float?
  longitude       Float?
  
  // Location (online)
  onlineLink      String?
  
  // Capacity
  capacity        Int?
  minCapacity     Int?
  remainingSpots  Int?
  
  // Pricing
  price           Decimal?          @db.Decimal(12, 2)
  currency        String            @default("FCFA")
  
  // Status
  isActive        Boolean           @default(true)
  isFeatured      Boolean           @default(false)
  isPublished     Boolean           @default(false)
  status          String            @default("DRAFT") // DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED
  
  // Organizer
  organizerName   String?
  organizerContact String?
  organizerWhatsapp String?
  organizerEmail  String?
  
  // Conditions
  rules           String?
  refundPolicy    String?
  minAge          Int?
  accessConditions String?
  
  // Stats (auto-calculated)
  ticketsSold     Int               @default(0)
  totalRevenue    Decimal           @default(0) @db.Decimal(12, 2)
  viewsCount      Int               @default(0)
  
  // Relations
  tickets         EventTicket[]
  participants    EventParticipant[]
  scans           EventScan[]
  promotions      EventPromotion[]
  gallery         EventGallery[]
  partners        EventPartner[]
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?
  
  @@index([businessId])
  @@index([startDate])
  @@index([type])
  @@index([status])
}`;

c = c.replace(oldEventModel, newEventModel);

// ============================================
// 3. Add new models AFTER Event model (before Rental models)
// ============================================

const rentalCommentIdx = c.indexOf('// ============================================\n// RENTAL MODELS');
const newModelsBlock = `
// ============================================
// EVENT TICKET (Module 15)
// ============================================

model EventTicket {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  type            TicketType        @default(STANDARD)
  price           Decimal?          @db.Decimal(12, 2)
  currency        String            @default("FCFA")
  quantity        Int               @default(100)
  remaining       Int               @default(100)
  benefits        String[]
  saleStartAt     DateTime?
  saleEndAt       DateTime?
  saleStatus      TicketSaleStatus  @default(ACTIVE)
  isActive        Boolean           @default(true)
  sortOrder       Int               @default(0)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([eventId])
  @@index([type])
}

// ============================================
// EVENT PARTICIPANT (Module 15)
// ============================================

model EventParticipant {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  ticketId        String?
  ticket          EventTicket?      @relation(fields: [ticketId], references: [id])
  
  // Client info
  clientId        String?
  client          User?             @relation(fields: [clientId], references: [id])
  firstName       String
  lastName        String
  email           String?
  phone           String?
  
  // Ticket info
  ticketRef       String            @unique
  qrCode          String?
  qrData          String?
  ticketType      TicketType        @default(STANDARD)
  price           Decimal?          @db.Decimal(12, 2)
  currency        String            @default("FCFA")
  
  // Payment
  paymentMethod   String?
  paymentRef      String?
  isPaid          Boolean           @default(false)
  paidAt          DateTime?
  
  // Status
  status          ParticipantStatus @default(REGISTERED)
  checkedInAt     DateTime?
  checkedInBy     String?
  isOnWaitlist    Boolean           @default(false)
  notes           String?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([eventId])
  @@index([ticketId])
  @@index([clientId])
  @@index([status])
  @@index([ticketRef])
}

// ============================================
// EVENT SCAN (Module 15)
// ============================================

model EventScan {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantId   String?
  participant     EventParticipant? @relation(fields: [participantId], references: [id])
  
  scannerId       String?
  scanner         User?             @relation(fields: [scannerId], references: [id])
  ticketRef       String
  status          String            // VALID, ALREADY_USED, EXPIRED, INVALID, FRAUD_SUSPECTED
  isDuplicate     Boolean           @default(false)
  notes           String?
  
  createdAt       DateTime          @default(now())
  
  @@index([eventId])
  @@index([participantId])
  @@index([ticketRef])
}

// ============================================
// EVENT PROMOTION (Module 15)
// ============================================

model EventPromotion {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  code            String            @unique
  description     String?
  discountType    String            // PERCENTAGE, FIXED
  discountValue   Decimal           @db.Decimal(12, 2)
  maxUses         Int?
  usedCount       Int               @default(0)
  minTickets      Int               @default(1)
  maxTickets      Int?
  startsAt        DateTime?
  endsAt          DateTime?
  isActive        Boolean           @default(true)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([eventId])
  @@index([code])
}

// ============================================
// EVENT GALLERY (Module 15)
// ============================================

model EventGallery {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  url             String
  type            String            // IMAGE, VIDEO
  caption         String?
  sortOrder       Int               @default(0)
  isActive        Boolean           @default(true)
  
  createdAt       DateTime          @default(now())
  
  @@index([eventId])
}

// ============================================
// EVENT PARTNER (Module 15)
// ============================================

model EventPartner {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  name            String
  logo            String?
  website         String?
  description     String?
  isSponsor       Boolean           @default(false)
  sortOrder       Int               @default(0)
  
  createdAt       DateTime          @default(now())
  
  @@index([eventId])
}
`;

c = c.substring(0, rentalCommentIdx) + newModelsBlock + '\n' + c.substring(rentalCommentIdx);

// ============================================
// 4. Add event relations to Business model
// ============================================

// Add event relations after existing event relation in Business
// The Business model should have events Event[] relation
// Let me check if it already exists
const businessEventsIdx = c.indexOf('events            Event[]');
if (businessEventsIdx >= 0) {
  // Replace with enriched version
  c = c.replace(
    'events            Event[]',
    'events            Event[]\n  eventTickets      EventTicket[]\n  eventParticipants  EventParticipant[]\n  eventScans        EventScan[]\n  eventPromotions   EventPromotion[]\n  eventGallery      EventGallery[]\n  eventPartners     EventPartner[]'
  );
} else {
  console.log('WARNING: events relation not found in Business model');
}

// ============================================
// 5. Check and fix any issues with the old `invoiceItems` in Event model
// ============================================
// The old Event model had invoiceItems InvoiceItem[] added during schema rebuild
// Let me check if it's still there
if (c.includes('invoiceItems    InvoiceItem[]\n  title           String')) {
  c = c.replace(
    'invoiceItems    InvoiceItem[]\n  title           String',
    'title           String'
  );
}

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Event models added to schema');

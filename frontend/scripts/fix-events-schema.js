const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ============================================
// 1. Remove extra Business relations (eventTickets, etc.) - keep only events Event[]
// ============================================
c = c.replace(
  '  events            Event[]\n  eventTickets      EventTicket[]\n  eventParticipants  EventParticipant[]\n  eventScans        EventScan[]\n  eventPromotions   EventPromotion[]\n  eventGallery      EventGallery[]\n  eventPartners     EventPartner[]',
  '  events            Event[]'
);

// ============================================
// 2. Replace old Event model with enriched version
// ============================================
const oldEvent = `model Event {
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

const newEvent = `model Event {
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
  status          String            @default("DRAFT")
  
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

if (c.includes(oldEvent)) {
  c = c.replace(oldEvent, newEvent);
  console.log('✅ Event model replaced successfully');
} else {
  console.log('❌ Old Event model NOT found - checking exact match...');
  // Try to find it with different whitespace
  const idx = c.indexOf('model Event {');
  const endIdx = c.indexOf('}', c.indexOf('}', c.indexOf('}', c.indexOf('}', idx) + 1) + 1) + 1);
  console.log('Old Event model from', idx, 'to', endIdx);
  console.log(c.substring(idx, endIdx+1));
}

// ============================================
// 3. Add User opposite relations for EventParticipant.client and EventScan.scanner
// ============================================
// Find User model and add eventParticipants and eventScans
const userEventPartIdx = c.indexOf('eventParticipants  EventParticipant[]');
if (userEventPartIdx === -1) {
  // Add after existing event-related User relations or other relations
  const userNotifications = c.indexOf('notifications     Notification[]');
  if (userNotifications >= 0) {
    c = c.replace(
      'notifications     Notification[]',
      'notifications     Notification[]\n  eventParticipants  EventParticipant[]\n  eventScans         EventScan[]'
    );
    console.log('✅ Added User opposite relations');
  } else {
    console.log('❌ Could not find User notifications field');
  }
}

// ============================================
// 4. Add EventTicket opposite relation for EventParticipant.ticket
// Already has participants in EventTicket? No, EventTicket doesn't have participants field
// Need to add it
// ============================================
const ticketSortOrder = c.indexOf('  sortOrder       Int               @default(0)\n  \n  createdAt       DateTime');
if (ticketSortOrder >= 0) {
  c = c.replace(
    '  sortOrder       Int               @default(0)\n  \n  createdAt       DateTime',
    '  sortOrder       Int               @default(0)\n  participants    EventParticipant[]\n  createdAt       DateTime'
  );
  console.log('✅ Added participants to EventTicket');
}

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Event schema fixes applied');

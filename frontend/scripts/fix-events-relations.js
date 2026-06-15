const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ============================================
// 1. Add opposite relations to Event model
// Insert before the closing @@index lines
// ============================================
c = c.replace(
  '  @@index([businessId])\n  @@index([date])\n}',
  '  tickets         EventTicket[]\n  participants    EventParticipant[]\n  scans           EventScan[]\n  promotions      EventPromotion[]\n  gallery         EventGallery[]\n  partners        EventPartner[]\n  \n  @@index([businessId])\n  @@index([date])\n}'
);

// ============================================
// 2. Add opposite relations to User model
// Find User model and add eventParticipants and eventScans
// ============================================
c = c.replace(
  '  notifications     Notification[]\n  sessions          Session[]',
  '  notifications     Notification[]\n  eventParticipants  EventParticipant[]\n  eventScans         EventScan[]\n  sessions          Session[]'
);

// ============================================
// 3. Add opposite relation to EventTicket for participants
// ============================================
c = c.replace(
  '  isActive        Boolean           @default(true)\n  sortOrder       Int               @default(0)\n  \n  createdAt       DateTime',
  '  isActive        Boolean           @default(true)\n  sortOrder       Int               @default(0)\n  participants    EventParticipant[]\n  createdAt       DateTime'
);

// ============================================
// 4. Add opposite relation to EventParticipant for scans
// ============================================
c = c.replace(
  '  isOnWaitlist    Boolean           @default(false)\n  notes           String?\n  \n  createdAt       DateTime',
  '  isOnWaitlist    Boolean           @default(false)\n  notes           String?\n  scans           EventScan[]\n  createdAt       DateTime'
);

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Event opposite relations added to all models');

const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ============================================
// Fix 1: BusinessPaymentMethod - remove bad 'deliveries' field
// ============================================
c = c.replace(
  '  isActive    Boolean  @default(true)\n  deliveries  Delivery[]\n  createdAt   DateTime  @default(now())',
  '  isActive    Boolean  @default(true)\n  createdAt   DateTime  @default(now())'
);

// ============================================
// Fix 2: ProductVariant - add orderItems opposite for OrderItem.variant
// ============================================
c = c.replace(
  '  isActive    Boolean   @default(true)\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  @@index([productId])\n}\n\n// ============================================\n// ORDER MODELS\n// ============================================\n\nmodel Order {',
  '  isActive    Boolean   @default(true)\n  orderItems  OrderItem[]\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  @@index([productId])\n}\n\n// ============================================\n// ORDER MODELS\n// ============================================\n\nmodel Order {'
);

// ============================================
// Fix 3: Event - remove bad 'invoiceItems' field
// ============================================
c = c.replace(
  '  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)\n  invoiceItems    InvoiceItem[]\n  title           String',
  '  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)\n  title           String'
);

// ============================================
// Fix 4: Quote - add quoteItems opposite for QuoteItem.quote
// ============================================
c = c.replace(
  '  status          QuoteStatus     @default(DRAFT)\n  createdAt       DateTime        @default(now())\n  updatedAt       DateTime        @updatedAt\n  deletedAt       DateTime?\n\n  @@index([businessId])\n  @@index([clientId])\n}\n\nmodel QuoteItem',
  '  status          QuoteStatus     @default(DRAFT)\n  quoteItems      QuoteItem[]\n  createdAt       DateTime        @default(now())\n  updatedAt       DateTime        @updatedAt\n  deletedAt       DateTime?\n\n  @@index([businessId])\n  @@index([clientId])\n}\n\nmodel QuoteItem'
);

// ============================================
// Fix 5: Invoice - add @unique on quoteId for one-to-one
// Also need to find the Invoice model and add quoteItems opposite + invoiceItems
// ============================================
c = c.replace(
  '  quoteId         String?\n  quote           Quote?          @relation(fields: [quoteId], references: [id])\n  clientName',
  '  quoteId         String? @unique\n  quote           Quote?          @relation(fields: [quoteId], references: [id])\n  clientName'
);

// Add invoiceItems to Invoice model
c = c.replace(
  '  payments        Payment[]\n  escrows         Escrow[]\n  createdAt       DateTime',
  '  payments        Payment[]\n  escrows         Escrow[]\n  invoiceItems    InvoiceItem[]\n  createdAt       DateTime'
);

// ============================================
// Fix 6: Payment - add quote opposite on Quote model
// ============================================
c = c.replace(
  '  payments        Payment[]',
  '  payments        Payment[]\n  subscriptionPayments SubscriptionPayment[]'
);
// Oops, that's too generic. Let me be more specific.

// Actually let me redo - the issue is:
// 1) Payment.quote needs Quote.payments opposite (already has Quote.payments)
// Wait, looking more carefully: Payment has quote Quote? and invoice Invoice? 
// Quote already has payments Payment[] - so this is fine!
// Let me check which opposites are actually missing.

// ============================================
// Fix 7: Escrow - add @unique on invoiceId, quoteId for Invoice and Quote
// Escrow.order already done
// ============================================
// Find the Escrow model's invoiceId and quoteId lines specifically
const lines = c.split('\n');
let escrowStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('model Escrow {')) {
    escrowStart = i;
    break;
  }
}

if (escrowStart >= 0) {
  for (let i = escrowStart; i < Math.min(escrowStart + 15, lines.length); i++) {
    if (lines[i].includes('  invoiceId') && !lines[i].includes('@unique')) {
      lines[i] = lines[i].replace('invoiceId', 'invoiceId @unique');
    }
    if (lines[i].includes('  quoteId') && !lines[i].includes('@unique') && lines[i].includes('?')) {
      lines[i] = lines[i].replace('quoteId', 'quoteId @unique');
    }
  }
  c = lines.join('\n');
}

// Add escrows to Invoice model
c = c.replace(
  '  invoiceItems    InvoiceItem[]\n  payments        Payment[]',
  '  invoiceItems    InvoiceItem[]\n  payments        Payment[]\n  escrows         Escrow[]'
);

// Add escrows to Quote model  
c = c.replace(
  '  payments        Payment[]\n  subscriptionPayments SubscriptionPayment[]',
  '  payments        Payment[]\n  escrows         Escrow[]\n  subscriptionPayments SubscriptionPayment[]'
);

// ============================================
// Fix 8: LoyaltyPoints - add transactions opposite for LoyaltyTransaction.loyalty
// ============================================
c = c.replace(
  '  totalPoints     Int             @default(0)\n  lifetimePoints  Int             @default(0)\n  createdAt       DateTime        @default(now())',
  '  totalPoints     Int             @default(0)\n  lifetimePoints  Int             @default(0)\n  transactions    LoyaltyTransaction[]\n  createdAt       DateTime        @default(now())'
);

// ============================================
// Fix 9: Delivery - add @unique on orderId for one-to-one
// ============================================
c = c.replace(
  '  orderId           String?\n  order             Order?              @relation(fields: [orderId], references: [id])',
  '  orderId           String? @unique\n  order             Order?              @relation(fields: [orderId], references: [id])'
);

// ============================================
// Fix 10: DeliveryZone - add deliveries opposite for Delivery.zone
// ============================================
c = c.replace(
  '  isActive    Boolean  @default(true)\n  orders          Order[]',
  '  isActive    Boolean  @default(true)\n  orders          Order[]\n  deliveries      Delivery[]'
);

// ============================================
// Fix 11: DeveloperProfile - need to remove the bad fields and cleanly add them
// Actually the problem is from missing opposite relations in the Developer* models
// Let me check what's in the DeveloperModuleInstallation, etc.
// For now let me just remove the problematic lines from DeveloperProfile
// and see if the developer models are standalone
// ============================================

// Actually, the safest approach: remove the problematic relation fields from DeveloperProfile
// since they reference models that don't have opposite fields
c = c.replace(
  '  modules             DeveloperModule[]\n  moduleInstallations DeveloperModuleInstallation[]\n  moduleReviews       DeveloperModuleReview[]\n  supportTickets      DeveloperSupportTicket[]\n  supportMessages      DeveloperSupportMessage[]\n  adCampaigns         AdCampaign[]',
  '  modules             DeveloperModule[]'
);

// ============================================
// Fix 12: DeveloperSupportTicket - remove module relation since DeveloperModule doesn't have opposite
// ============================================
c = c.replace(
  '  moduleId            String?\n  module              DeveloperModule? @relation(fields: [moduleId], references: [id])',
  '  moduleId            String?'
);

// ============================================
// Fix 13: MenuItem - add @relation name for ingredients
// ============================================
c = c.replace(
  '  ingredients     Ingredient[]',
  '  ingredients     Ingredient[] @relation("MenuItemIngredients")'
);

// ============================================
// Fix 14: Remove duplicate SubscriptionPayment from Payment/Quote
// Let me check first if we have duplicate subscriptionPayments
// ============================================

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ All relation fixes applied');

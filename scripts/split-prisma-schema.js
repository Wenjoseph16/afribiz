#!/usr/bin/env node
/**
 * Split schema.prisma into prisma/schema/ directory (Prisma 5.22+ prismaSchemaFolder)
 * 
 * Structure:
 *   prisma/schema/
 *     main.prisma          — generator + datasource + enums
 *     core.prisma          — User, Session, RefreshToken, SecurityLog, etc.
 *     business.prisma      — Business, BusinessSettings, BusinessHour, etc.
 *     product.prisma       — Product, ProductCategory, ProductVariant
 *     service.prisma       — Service, ServiceCategory, ServiceEmployee
 *     menu.prisma          — MenuCategory, MenuItem, MenuItemVariant, etc.
 *     booking.prisma       — Booking, BookingResource, TimeSlot, etc.
 *     order.prisma         — Order, OrderItem
 *     payment.prisma       — Payment, PaymentProof, PaymentTransaction, Wallet
 *     finance.prisma       — Debt, Escrow, Quote, Invoice, etc.
 *     crm.prisma           — BusinessClient, ClientNote, ClientSegment, etc.
 *     event.prisma         — Event, EventTicket, EventParticipant, etc.
 *     content.prisma       — Story, Short, Live, Post, etc.
 *     social.prisma        — Follow, SocialAccount, Alert, SavedItem
 *     notification.prisma  — Notification, NotificationDelivery, etc.
 *     employee.prisma      — Employee, EmployeeRole, Attendance, etc.
 *     rental.prisma        — Rental
 *     room.prisma          — Room
 *     promo.prisma         — Promotion, Coupon, Campaign, Loyalty, etc.
 *     delivery.prisma      — Delivery, Driver, DeliveryZone, etc.
 *     review.prisma        — Review, BusinessReview
 *     message.prisma       — Conversation, Message
 *     misc.prisma          — Remaining models
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_DIR = 'backend/prisma/schema';
const SOURCE_FILE = 'backend/prisma/schema.prisma';

// Read the original file
const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
const lines = content.split('\n');

// Category assignments for models
const MODEL_CATEGORIES = {
  // Core auth/security
  User: 'core',
  Session: 'core',
  RefreshToken: 'core',
  PasswordReset: 'core',
  EmailVerification: 'core',
  OtpCode: 'core',
  Device: 'core',
  SecurityLog: 'core',
  WebAuthnCredential: 'core',
  RevokedToken: 'core',
  FraudEvent: 'core',
  AdminKyc: 'core',
  AdminAuditLog: 'core',
  UserRoleAssignment: 'core',
  ConversationParticipant: 'core',

  // Business profile
  Business: 'business',
  BusinessSettings: 'business',
  BusinessHour: 'business',
  BusinessPaymentMethod: 'business',
  DeliveryZone: 'business',
  BusinessModuleAssignment: 'business',
  BusinessScore: 'business',
  ScoreHistory: 'business',
  BusinessBadge: 'business',
  DataConsent: 'business',
  DataAccessLog: 'business',

  // Products
  Product: 'product',
  ProductCategory: 'product',
  ProductVariant: 'product',

  // Services
  Service: 'service',
  ServiceCategory: 'service',
  ServiceEmployee: 'service',

  // Menu
  MenuCategory: 'menu',
  MenuItem: 'menu',
  MenuItemVariant: 'menu',
  Ingredient: 'menu',
  RestaurantTable: 'menu',
  MenuOrder: 'menu',

  // Bookings
  Booking: 'booking',
  BookingResource: 'booking',
  TimeSlot: 'booking',
  BookingReminder: 'booking',

  // Orders
  Order: 'order',
  OrderItem: 'order',

  // Payments
  Payment: 'payment',
  PaymentProof: 'payment',
  PaymentTransaction: 'payment',
  Cart: 'payment',
  CartItem: 'payment',
  Wallet: 'payment',
  WalletTransaction: 'payment',

  // Finance (debts, escrow, quotes, invoices)
  Debt: 'finance',
  DebtReminder: 'finance',
  Escrow: 'finance',
  ClientRisk: 'finance',
  FinancialLog: 'finance',
  Quote: 'finance',
  QuoteItem: 'finance',
  Invoice: 'finance',
  InvoiceItem: 'finance',
  Expense: 'finance',

  // CRM
  BusinessClient: 'crm',
  BusinessTag: 'crm',
  BusinessClientTag: 'crm',
  ClientNote: 'crm',
  ClientSegment: 'crm',
  SegmentClient: 'crm',
  ClientActivityLog: 'crm',
  BusinessPageView: 'crm',
  ProductView: 'crm',
  ProductClick: 'crm',

  // Events
  Event: 'event',
  EventTicket: 'event',
  EventParticipant: 'event',
  EventScan: 'event',
  EventPromotion: 'event',
  EventGallery: 'event',
  EventPartner: 'event',

  // Content (stories, shorts, live, posts, feed)
  Story: 'content',
  StoryView: 'content',
  StorySticker: 'content',
  Short: 'content',
  ShortLike: 'content',
  ShortComment: 'content',
  ShortView: 'content',
  ShortSave: 'content',
  Live: 'content',
  LiveProduct: 'content',
  LiveParticipant: 'content',
  LiveChat: 'content',
  LiveReaction: 'content',
  Post: 'content',
  PostLike: 'content',
  FeedItem: 'content',
  OfferFlash: 'content',
  Comment: 'content',
  ContentReport: 'content',

  // Social
  Follow: 'social',
  SocialAccount: 'social',
  Alert: 'social',
  SavedItem: 'social',

  // Notifications
  Notification: 'notification',
  NotificationDelivery: 'notification',
  NotificationPreference: 'notification',
  BusinessNotificationTemplate: 'notification',

  // Employees
  Employee: 'employee',
  EmployeeRole: 'employee',
  EmployeeSchedule: 'employee',
  EmployeeDocument: 'employee',
  EmployeePerformance: 'employee',
  EmployeeActivity: 'employee',
  Attendance: 'employee',
  LeaveRequest: 'employee',

  // Rentals
  Rental: 'rental',

  // Rooms
  Room: 'room',

  // Promotions
  Promotion: 'promo',
  PromotionLog: 'promo',
  Coupon: 'promo',
  Bundle: 'promo',
  MarketingCampaign: 'promo',
  LoyaltyProgram: 'promo',
  LoyaltyPoints: 'promo',

  // Deliveries
  Delivery: 'delivery',
  DeliveryTracking: 'delivery',
  DeliveryProof: 'delivery',
  Driver: 'delivery',

  // Reviews
  Review: 'review',
  BusinessReview: 'review',

  // Messages
  Conversation: 'message',
  Message: 'message',

  // Misc
  Favorite: 'misc',
  BusinessDocument: 'misc',
  Partner: 'misc',
  PartnerContract: 'misc',
  PartnerTransaction: 'misc',
  PartnerAssignment: 'misc',
  PartnerReview: 'misc',
  PartnerDocument: 'misc',
  PartnerPermission: 'misc',
  Dispute: 'misc',
  SubscriptionPlan: 'misc',
  BusinessSubscription: 'misc',
  SubscriptionPayment: 'misc',
  SubscriptionLog: 'misc',
  PlanningTask: 'misc',
  PlanningLog: 'misc',
  AdCampaign: 'misc',
  AdImpression: 'misc',
  AdClick: 'misc',
  Referral: 'misc',
  ReferralReward: 'misc',
  Training: 'misc',
  UserTraining: 'misc',
  TrainingLesson: 'misc',
  AdminRoleAssignment: 'misc',
  CmsPage: 'misc',
  FormSubmission: 'misc',
  FormTemplate: 'misc',
  MediaModerationItem: 'misc',
  UserWarning: 'misc',
  GrowthBrief: 'misc',
  SearchLog: 'misc',
  MarketVote: 'misc',
  Opportunity: 'misc',
  MarketNeed: 'misc',
  MarketIdea: 'misc',
  CopilotConfiguration: 'misc',
  TaskCategory: 'misc',
  TaskComment: 'misc',
  ModuleConfiguration: 'misc',
  ModuleActivityLog: 'misc',
  PageView: 'misc',
  BusinessDailyStats: 'misc',
  ProductDailyStats: 'misc',
  ClientDailyStats: 'misc',
  Quest: 'misc',
  Streak: 'misc',
  Leaderboard: 'misc',
  Challenge: 'misc',
  DeveloperProfile: 'misc',
  DeveloperModule: 'misc',
  DeveloperModuleVersion: 'misc',
  DeveloperModuleInstallation: 'misc',
  DeveloperModuleReview: 'misc',
  DeveloperModuleAnalytics: 'misc',
  DeveloperRevenue: 'misc',
  DeveloperPayout: 'misc',
  DeveloperSupportTicket: 'misc',
  DeveloperSupportMessage: 'misc',
  UserQuizAttempt: 'misc',
};

// Parse enums and models
let currentSection = null;
let currentSectionLines = [];
const enums = {};
const models = {};
const generatorLines = [];
const datasourceLines = [];
const otherLines = [];

let section = 'header';

function flushSection() {
  if (currentSectionLines.length === 0) return;
  const joined = currentSectionLines.join('\n');
  
  if (currentSection === 'enum') {
    const name = currentSectionLines[0].replace('enum ', '').replace(' {', '').trim();
    enums[name] = currentSectionLines;
  } else if (currentSection === 'model') {
    const name = currentSectionLines[0].replace('model ', '').replace(' {', '').trim();
    models[name] = currentSectionLines;
  } else if (currentSection === 'comment') {
    otherLines.push(...currentSectionLines);
  }
  currentSectionLines = [];
}

for (const line of lines) {
  const trimmed = line.trim();
  
  // Detect section
  if (trimmed.startsWith('generator ')) {
    flushSection();
    section = 'generator';
    currentSection = null;
    generatorLines.push(line);
  } else if (trimmed.startsWith('datasource ')) {
    flushSection();
    section = 'datasource';
    currentSection = null;
    datasourceLines.push(line);
  } else if (trimmed.startsWith('enum ')) {
    flushSection();
    currentSection = 'enum';
    currentSectionLines = [line];
  } else if (trimmed.startsWith('model ')) {
    flushSection();
    currentSection = 'model';
    currentSectionLines = [line];
  } else if (trimmed.startsWith('//')) {
    flushSection();
    currentSection = 'comment';
    currentSectionLines = [line];
  } else if (trimmed === '' && currentSection === 'comment') {
    currentSectionLines.push(line);
  } else {
    if (section === 'generator') {
      generatorLines.push(line);
    } else if (section === 'datasource') {
      datasourceLines.push(line);
    } else if (currentSection) {
      currentSectionLines.push(line);
    }
  }
}
flushSection();

// Write main.prisma (generator + datasource + enums)
const mainContent = [
  '// ═══════════════════════════════════════════════',
  '// MAIN — Generator, Datasource & All Enums',
  '// ═══════════════════════════════════════════════',
  '',
  ...generatorLines,
  '  previewFeatures = ["prismaSchemaFolder"]',
  ...datasourceLines,
  '',
  '// ═══════════════════════════════════════════════',
  '// ALL ENUMS',
  '// ═══════════════════════════════════════════════',
  '',
];

for (const [name, enumLines] of Object.entries(enums)) {
  mainContent.push(...enumLines);
  mainContent.push('');
}

const mainOutput = mainContent.join('\n');
fs.writeFileSync(path.join(SCHEMA_DIR, 'main.prisma'), mainOutput, 'utf-8');
console.log(`✓ main.prisma — ${Object.keys(enums).length} enums + generator/datasource`);

// Write domain files
for (const [cat, files] of Object.entries({
  core: 'core.prisma',
  business: 'business.prisma',
  product: 'product.prisma',
  service: 'service.prisma',
  menu: 'menu.prisma',
  booking: 'booking.prisma',
  order: 'order.prisma',
  payment: 'payment.prisma',
  finance: 'finance.prisma',
  crm: 'crm.prisma',
  event: 'event.prisma',
  content: 'content.prisma',
  social: 'social.prisma',
  notification: 'notification.prisma',
  employee: 'employee.prisma',
  rental: 'rental.prisma',
  room: 'room.prisma',
  promo: 'promo.prisma',
  delivery: 'delivery.prisma',
  review: 'review.prisma',
  message: 'message.prisma',
  misc: 'misc.prisma',
})) {
  const fileModels = Object.entries(models)
    .filter(([name]) => MODEL_CATEGORIES[name] === cat)
    .sort(([a], [b]) => a.localeCompare(b));

  if (fileModels.length === 0) continue;

  const lines = [
    `// ═══════════════════════════════════════════════`,
    `// ${cat.toUpperCase()} MODELS`,
    `// ═══════════════════════════════════════════════`,
    '',
  ];

  for (const [, modelLines] of fileModels) {
    lines.push(...modelLines);
    lines.push('');
  }

  const output = lines.join('\n');
  fs.writeFileSync(path.join(SCHEMA_DIR, files), output, 'utf-8');
  console.log(`✓ ${files} — ${fileModels.length} models`);
}

// Total count
const totalModels = Object.values(MODEL_CATEGORIES).filter(c => c !== 'core' || true).length;
console.log(`\n✅ Split complete: ${Object.keys(enums).length} enums + ${Object.keys(models).length} models into ${Object.keys({...Object.fromEntries(Object.entries(MODEL_CATEGORIES).map(([k,v]) => [v,1]))}).length} files`);

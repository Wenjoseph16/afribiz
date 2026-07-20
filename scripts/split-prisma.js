const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'backend', 'prisma', 'schema.prisma');
const modelsDir = path.join(__dirname, '..', 'backend', 'prisma', 'models');
const schema = fs.readFileSync(schemaPath, 'utf-8');
const lines = schema.split('\n');

// Find generator block end (first enum or model keyword)
let configEndLine = 0;
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith('enum ') || trimmed.startsWith('model ')) {
    configEndLine = i - 1;
    break;
  }
}

const configLines = lines.slice(0, configEndLine + 1).join('\n');
const remainingText = lines.slice(configEndLine + 1).join('\n');

// Parse remaining blocks (enums and models)
const blockRegex = /(enum|model) (\w+)[\s\S]*?(?=\n(enum|model) |\nimport |$)/g;
const matches = remainingText.matchAll(/^(enum|model) (\w+)[\s\S]*?(?=^enum |^model |^import |\Z)/gm);

// Actually let's just split by lines and track blocks
const enumBlocks = [];
const modelBlocks = [];
let currentBlock = [];
let currentType = null;

for (const line of lines.slice(configEndLine + 1)) {
  const trimmed = line.trim();
  if (trimmed.startsWith('enum ') && currentType === null) {
    currentType = 'enum';
    currentBlock = [line];
  } else if (trimmed.startsWith('model ') && currentType === null) {
    currentType = 'model';
    currentBlock = [line];
  } else if ((trimmed.startsWith('enum ') || trimmed.startsWith('model ')) && currentType !== null) {
    // Save previous block
    if (currentType === 'enum') enumBlocks.push(currentBlock.join('\n'));
    else modelBlocks.push(currentBlock.join('\n'));
    currentType = trimmed.startsWith('enum ') ? 'enum' : 'model';
    currentBlock = [line];
  } else if (trimmed.startsWith('import ')) {
    if (currentType === 'enum' && currentBlock.length > 0) enumBlocks.push(currentBlock.join('\n'));
    else if (currentType === 'model' && currentBlock.length > 0) modelBlocks.push(currentBlock.join('\n'));
    currentType = null;
    currentBlock = [];
  } else {
    if (currentBlock) currentBlock.push(line);
  }
}
// Push last block
if (currentType === 'enum' && currentBlock.length > 0) enumBlocks.push(currentBlock.join('\n'));
else if (currentType === 'model' && currentBlock.length > 0) modelBlocks.push(currentBlock.join('\n'));

console.log(`Found ${enumBlocks.length} enums, ${modelBlocks.length} models`);

// Domain model classification
const domainMap = {
  auth: ['User', 'Session', 'RefreshToken', 'PasswordReset', 'EmailVerification', 'OtpCode', 'Device', 'SecurityLog', 'AdminRole', 'AdminRoleAssignment', 'AdminPermission', 'ApiKey', 'RevokedToken'],
  business: ['Business', 'BusinessReview', 'BusinessPageView', 'BusinessVerification', 'BusinessHour', 'Favorite', 'Follow', 'BusinessModule', 'BusinessSetting'],
  commerce: ['Product', 'ProductCategory', 'ProductVariant', 'ProductImage', 'Service', 'ServiceCategory', 'Menu', 'MenuItem', 'MenuCategory', 'Room', 'RoomBooking', 'Rental', 'RentalBooking', 'Cart', 'CartItem', 'Coupon', 'Wishlist'],
  orders: ['Order', 'OrderItem', 'Debt', 'DebtPayment', 'Delivery', 'DeliveryZone', 'DeliveryDriver', 'DeliveryAssignment'],
  payment: ['Payment', 'PaymentTransaction', 'PaymentMethod', 'PaymentProof', 'Escrow', 'EscrowStep', 'Wallet', 'WalletTransaction', 'Subscription', 'SubscriptionPlan', 'SubscriptionPayment', 'Payout', 'Commission', 'TransactionFee', 'Invoice', 'Quote'],
  content: ['Post', 'PostLike', 'PostSave', 'Story', 'StoryView', 'Short', 'ShortLike', 'ShortComment', 'ShortView', 'ShortSave', 'Live', 'LiveProduct', 'LiveParticipant', 'LiveChat', 'LiveReaction', 'OfferFlash', 'ClaimedOffer', 'FeedItem', 'Comment', 'ContentReport', 'Reaction'],
  crm: ['Message', 'Conversation', 'ConversationParticipant', 'Notification', 'NotificationDelivery', 'NotificationPreference', 'NotificationTemplate', 'Alert', 'SavedItem', 'SupportTicket', 'TicketResponse'],
  social: ['SocialAccount', 'SocialPost', 'Referral', 'ReferralReward', 'GroupBuy', 'GroupBuyParticipant', 'SavingsGroup', 'SavingsCycle', 'SavingsContribution', 'SavingsLoan', 'Tontine'],
  people: ['Employee', 'EmployeeDocument', 'EmployeeLeave', 'Payroll', 'PayrollItem', 'Partner', 'Client', 'ClientSegment', 'ClientTag', 'ClientNote', 'ClientActivity'],
  scheduling: ['Booking', 'BookingResource', 'BookingSlot', 'PlanningTask', 'TaskCategory', 'TaskChecklistItem', 'TaskComment', 'TaskTimer', 'Event', 'EventTicket', 'Training', 'TrainingLesson', 'TrainingStudent'],
  marketing: ['Promotion', 'PromotionCoupon', 'PromotionBundle', 'Campaign', 'CampaignAudience', 'Ad', 'AdPlacement', 'AdImpression', 'AdClick'],
  analytics: ['PageView', 'ProductView', 'ProductClick', 'SearchQuery', 'UserActivity', 'AnalyticsEvent', 'Metric', 'DashboardWidget', 'Report', 'DataRetentionRule'],
  system: ['Setting', 'PlatformSetting', 'FeatureFlag', 'AuditLog', 'CronJob', 'CronJobLog', 'Backup', 'SystemLog', 'Webhook', 'WebhookEvent'],
  growth: ['GrowthBrief', 'GrowthMetric', 'GrowthAction', 'CopilotSession', 'CopilotMessage', 'Opportunity', 'MarketNeed', 'MarketIdea', 'AttentionItem', 'CopilotOnboardingLog'],
  gamification: ['Badge', 'UserBadge', 'Achievement', 'Point', 'PointTransaction', 'Leaderboard', 'LeaderboardEntry'],
  developer: ['DeveloperProfile', 'DeveloperModule', 'DeveloperModuleVersion', 'DeveloperReview', 'DeveloperPayout', 'DeveloperRevenue', 'AppStoreListing'],
};

// Assign each model to a domain
const domainModels = {};
for (const d of Object.keys(domainMap)) domainModels[d] = [];

for (const model of modelBlocks) {
  const name = model.match(/^model (\w+)/m)?.[1];
  if (!name) { console.log('Could not parse model name from:', model.substring(0, 50)); continue; }
  
  let assigned = false;
  for (const [domain, keywords] of Object.entries(domainMap)) {
    if (keywords.includes(name)) {
      domainModels[domain].push(model);
      assigned = true;
      break;
    }
  }
  if (!assigned) {
    // Default fallback
    domainModels.system.push(model);
  }
}

// Collect all enum names referenced by models
const allRefs = new Set();
for (const m of modelBlocks) {
  const refs = m.match(/(\w+)/g) || [];
  refs.forEach(r => {
    if (r.endsWith('Enum') || r.endsWith('Status') || r.endsWith('Type') || r.endsWith('Role')) allRefs.add(r);
  });
}

// Write enum file with ALL enums (not just used ones)
const enumFilePath = path.join(modelsDir, 'enums.prisma');
fs.writeFileSync(enumFilePath, enumBlocks.join('\n\n') + '\n');
console.log(`enums.prisma: ${enumBlocks.length} enums`);

// Write domain files
let totalAssigned = 0;
for (const [domain, models] of Object.entries(domainModels)) {
  if (models.length === 0) continue;
  totalAssigned += models.length;
  const filePath = path.join(modelsDir, `${domain}.prisma`);
  fs.writeFileSync(filePath, models.join('\n\n') + '\n');
  console.log(`${domain}.prisma: ${models.length} models`);
}

// Write new main schema
const importLines = Object.keys(domainModels)
  .filter(d => domainModels[d].length > 0)
  .map(d => `import "./models/${d}.prisma"`)
  .sort();

const newSchema = configLines + '\n\n// ===== Enums =====\n' +
  'import "./models/enums.prisma"\n\n// ===== Domain Models =====\n' +
  importLines.join('\n') + '\n';

fs.writeFileSync(schemaPath, newSchema);
console.log(`\n✅ Total: ${totalAssigned}/${modelBlocks.length} models split across ${importLines.length} domain files`);

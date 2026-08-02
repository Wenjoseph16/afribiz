/**
 * Restaure le drift Prisma (modèles orphelins + colonnes + enums) en alignant
 * schema.prisma sur la base live (introspection préalable), puis régénère les
 * partiels prisma/models/*.prisma depuis le schéma mis à jour.
 *
 * Chaque ancre est vérifiée : si absente OU non unique, le script échoue pour
 * éviter toute corruption silencieuse. Sécurité : schema.prisma est la seule
 * source de vérité (prisma generate + migrate utilisent ce fichier).
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');
const MODELS_DIR = path.join(ROOT, 'prisma', 'models');

function editFile(file: string, pairs: Array<[string, string]>): void {
  let s = fs.readFileSync(file, 'utf8');
  for (const [oldStr, newStr] of pairs) {
    const count = s.split(oldStr).length - 1;
    if (count === 0) throw new Error(`ANCHOR NOT FOUND in ${file}: ${JSON.stringify(oldStr.slice(0, 70))}`);
    if (count > 1) throw new Error(`ANCHOR NOT UNIQUE in ${file}: ${JSON.stringify(oldStr.slice(0, 70))} (${count} hits)`);
    s = s.replace(oldStr, newStr);
  }
  fs.writeFileSync(file, s);
  console.log('OK', path.relative(ROOT, file));
}

// ============================================================
// 1. ENUMS — valeurs présentes en base mais absentes du schéma
//    (ordre identique à pg_enum.enumsortorder de la base live)
// ============================================================
const ENUM_PAIRS: Array<[string, string]> = [
  // AdPlacementPage : + ABOUT, PRICING, CONTACT, DEVELOPERS, BLOG, MEDIA, BLOG_ARTICLE, LEGAL
  [
    '  BUSINESS_PUBLIC_PAGE\n}',
    '  BUSINESS_PUBLIC_PAGE\n  ABOUT\n  PRICING\n  CONTACT\n  DEVELOPERS\n  BLOG\n  MEDIA\n  BLOG_ARTICLE\n  LEGAL\n}',
  ],
  // BusinessModule : + SAVINGS, CRM, MARKETING, MEDIA, AFRISCORE, GROUP_BUY, VOICE
  [
    '  TRAINING\n}',
    '  TRAINING\n  SAVINGS\n  CRM\n  MARKETING\n  MEDIA\n  AFRISCORE\n  GROUP_BUY\n  VOICE\n}',
  ],
  // DebtSourceType : + MANUAL
  ['  PHYSICAL_SALE\n}', '  PHYSICAL_SALE\n  MANUAL\n}'],
  // NotificationChannel : + PUSH
  ['  WHATSAPP\n}', '  WHATSAPP\n  PUSH\n}'],
  // NotificationTemplateChannel : + PUSH
  ['  WHATSAPP\n  IN_APP\n}', '  WHATSAPP\n  IN_APP\n  PUSH\n}'],
  // SecurityLogAction : + KYC_CHECK, AML_BLOCK
  [
    '  FORM_TEMPLATE_CHANGED\n}',
    '  FORM_TEMPLATE_CHANGED\n  KYC_CHECK\n  AML_BLOCK\n}',
  ],
];

// ============================================================
// 2. MODÈLES EXISTANTS — colonnes manquantes (alignées sur la base)
// ============================================================
const MODEL_PAIRS: Array<[string, string]> = [
  // AdCampaign : + slotId/slot (FK AdSlot SET NULL), targetPages, targetPositions
  [
    '  package         AdPackage?     @relation(fields: [packageId], references: [id])\n  advertiserType  AdvertiserType',
    '  package         AdPackage?     @relation(fields: [packageId], references: [id])\n  slotId          String?\n  slot            AdSlot?        @relation(fields: [slotId], references: [id], onDelete: SetNull)\n  targetPages     String[]\n  targetPositions String[]\n  advertiserType  AdvertiserType',
  ],
  // AdCampaign : + index slotId
  [
    '  @@index([startDate, endDate])\n  @@index([businessId])\n}',
    '  @@index([startDate, endDate])\n  @@index([businessId])\n  @@index([slotId])\n}',
  ],
  // Business : + favoriteCount (ancre : alignement large, unique à Business)
  [
    '  reviewCount         Int                        @default(0)\n',
    '  reviewCount         Int                        @default(0)\n  favoriteCount       Int                        @default(0)\n',
  ],
  // Product : + favoriteCount (ancre 2 lignes avec orderCount, unique à Product)
  [
    '  reviewCount            Int              @default(0)\n  orderCount             Int              @default(0)\n',
    '  reviewCount            Int              @default(0)\n  favoriteCount           Int              @default(0)\n  orderCount             Int              @default(0)\n',
  ],
  // Review : + response, responseAt
  [
    '  comment   String?\n  images    String[]',
    '  comment   String?\n  response  String?\n  responseAt DateTime?\n  images    String[]',
  ],
  // CmsPage : + coverImage, type (enum CmsPageType)
  [
    '  excerpt     String?\n  category    String        @default("general")',
    '  excerpt     String?\n  coverImage  String?\n  type        CmsPageType @default(PAGE)\n  category    String        @default("general")',
  ],
  // CmsPage : + index type, type+status (ancre longue : publishedAt est propre à CmsPage,
  // FormTemplate se termine aussi par slug/category/status)
  [
    '  publishedAt DateTime?\n  createdAt   DateTime      @default(now())\n  updatedAt   DateTime      @updatedAt\n\n  @@index([slug])\n  @@index([category])\n  @@index([status])\n}',
    '  publishedAt DateTime?\n  createdAt   DateTime      @default(now())\n  updatedAt   DateTime      @updatedAt\n\n  @@index([slug])\n  @@index([category])\n  @@index([status])\n  @@index([type])\n  @@index([type, status])\n}',
  ],
  // SubscriptionPlan : businessId nullable (plans plateforme)
  [
    '  businessId   String\n  business     Business                @relation(fields: [businessId], references: [id], onDelete: Cascade)',
    '  businessId   String?\n  business     Business?               @relation(fields: [businessId], references: [id], onDelete: Cascade)',
  ],
  // User : + back-relation userMetadata
  [
    '  Wallet           Wallet[]\n\n  @@index([email])',
    '  Wallet           Wallet[]\n  userMetadata     UserMetadata?\n\n  @@index([email])',
  ],
  // Room : + back-relation blockedDates
  [
    '  bookings          Booking[]\n  createdAt         DateTime  @default(now())',
    '  bookings          Booking[]\n  blockedDates      RoomBlockedDate[]\n  createdAt         DateTime  @default(now())',
  ],
];

// ============================================================
// 3. APPEND — enum CmsPageType + 12 modèles orphelins
//    (définitions alignées au pixel sur l'introspection live)
// ============================================================
const MODELS_APPEND = `
// ============================================
// PLATFORM MODELS (AdSlots, Localisation, i18n, Metriques, Dashboards)
// ============================================

enum CmsPageType {
  PAGE
  ARTICLE
}

model AdSlot {
  id        String       @id @default(uuid())
  page      String
  position  String
  label     String
  width     Int          @default(0)
  height    Int          @default(0)
  isActive  Boolean      @default(true)
  campaigns AdCampaign[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@unique([page, position])
  @@index([page, position, isActive])
}

model Region {
  id        String   @id @default(uuid())
  code      String   @unique
  name      String
  countries Country[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Country {
  id           String    @id @default(uuid())
  code         String    @unique
  name         String
  regionId     String
  region       Region    @relation(fields: [regionId], references: [id], onDelete: Cascade)
  currency     String
  currencyCode String
  mobileMoney  String[]
  phoneCode    String?
  locales      String[]  @default(["fr"])
  isActive     Boolean   @default(true)
  cities       City[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([regionId])
  @@index([isActive])
}

model City {
  id        String   @id @default(uuid())
  countryId String
  country   Country  @relation(fields: [countryId], references: [id], onDelete: Cascade)
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([countryId, name])
  @@index([countryId, isActive])
}

model TranslationKey {
  id           String        @id @default(uuid())
  key          String        @unique
  namespace    String        @default("common")
  description  String?
  translations Translation[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([namespace])
}

model Translation {
  id        String         @id @default(uuid())
  keyId     String
  key       TranslationKey @relation(fields: [keyId], references: [id], onDelete: Cascade)
  locale    String
  value     String
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([keyId, locale])
  @@index([locale])
}

model UserMetadata {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  metadata  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model MetricSnapshot {
  id         String   @id @default(uuid())
  businessId String?
  metric     String
  value      Float    @default(0)
  period     String
  snapshotAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@index([businessId, metric])
  @@index([businessId, snapshotAt])
}

model PeriodAggregation {
  id         String   @id @default(uuid())
  businessId String?
  period     String
  metric     String
  value      Float    @default(0)
  date       DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([businessId, period, metric, date])
  @@index([businessId, period, date])
}

model DashboardLayout {
  id         String   @id @default(uuid())
  userId     String?
  businessId String?
  role       String   @default("BUSINESS")
  layout     Json     @default("[]")
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, businessId, role])
}

model DashboardWidget {
  id         String   @id @default(uuid())
  userId     String?
  businessId String?
  role       String   @default("BUSINESS")
  title      String
  type       String
  config     Json?    @default("{}")
  position   Int      @default(0)
  width      Int      @default(1)
  height     Int      @default(1)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@index([businessId])
  @@index([role])
}

model RoomBlockedDate {
  id        String   @id @default(uuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  startDate DateTime
  endDate   DateTime
  reason    String
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([roomId])
  @@index([startDate, endDate])
}
`;

// ============================================================
// ÉTAPE 1 : éditer schema.prisma
// ============================================================
editFile(SCHEMA, [...ENUM_PAIRS, ...MODEL_PAIRS]);

// Append des 12 modèles + enum CmsPageType en fin de fichier
const schemaContent = fs.readFileSync(SCHEMA, 'utf8');
if (schemaContent.includes('model RoomBlockedDate {')) {
  throw new Error('RoomBlockedDate déjà présent dans schema.prisma — append annulé');
}
fs.appendFileSync(SCHEMA, MODELS_APPEND);
console.log('OK schema.prisma (append 12 modèles + CmsPageType)');

// ============================================================
// ÉTAPE 2 : régénérer les partiels depuis le schéma mis à jour
// (basé sur la logique de split-prisma.js, mais SANS réécrire
//  schema.prisma au format prismaSchemaFolder)
// ============================================================
const schema = fs.readFileSync(SCHEMA, 'utf8');
const lines = schema.split('\n');

// Là où le bloc config (generator/datasource) se termine
let configEnd = 0;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t.startsWith('enum ') || t.startsWith('model ')) {
    configEnd = i - 1;
    break;
  }
}

// Découpage en blocs enum/model
const enumBlocks: Array<{ name: string; text: string }> = [];
const modelBlocks: Record<string, string> = {};
let curType: 'enum' | 'model' | null = null;
let curName = '';
const curLines: string[] = [];
const flush = () => {
  if (curType === 'enum') enumBlocks.push({ name: curName, text: curLines.join('\n') });
  else if (curType === 'model') modelBlocks[curName] = curLines.join('\n');
};
for (const line of lines.slice(configEnd + 1)) {
  const t = line.trim();
  if (t.startsWith('enum ') || t.startsWith('model ')) {
    flush();
    curType = t.startsWith('enum ') ? 'enum' : 'model';
    curName = t.split(/\s+/)[1] || '';
    curLines.length = 0;
    curLines.push(line);
  } else if (curType) {
    curLines.push(line);
  }
}
flush();

// Emplacement actuel de chaque modèle (partiels existants)
const currentFile: Record<string, string> = {};
for (const f of fs.readdirSync(MODELS_DIR)) {
  if (!f.endsWith('.prisma')) continue;
  const content = fs.readFileSync(path.join(MODELS_DIR, f), 'utf8');
  for (const m of content.matchAll(/^model (\w+)/gm)) {
    if (!currentFile[m[1]]) currentFile[m[1]] = f;
  }
}

// Nouveaux modèles → partiel cible
const NEW_MODEL_FILE: Record<string, string> = {
  AdSlot: 'system.prisma',
  Region: 'content.prisma',
  Country: 'content.prisma',
  City: 'content.prisma',
  TranslationKey: 'content.prisma',
  Translation: 'content.prisma',
  UserMetadata: 'auth.prisma',
  MetricSnapshot: 'analytics.prisma',
  PeriodAggregation: 'analytics.prisma',
  DashboardLayout: 'analytics.prisma',
  DashboardWidget: 'analytics.prisma',
  RoomBlockedDate: 'commerce.prisma',
};

// Tous les modèles du schéma doivent avoir un partiel cible
const grouped: Record<string, string[]> = {};
for (const name of Object.keys(modelBlocks)) {
  const file = currentFile[name] || NEW_MODEL_FILE[name];
  if (!file) throw new Error(`Aucun partiel cible pour le modèle ${name}`);
  (grouped[file] = grouped[file] || []).push(name);
}

// Écriture des partiels (ordre du schéma)
fs.writeFileSync(
  path.join(MODELS_DIR, 'enums.prisma'),
  enumBlocks.map((e) => e.text).join('\n\n') + '\n'
);
console.log('OK enums.prisma', enumBlocks.length, 'enums');

for (const [file, names] of Object.entries(grouped)) {
  fs.writeFileSync(
    path.join(MODELS_DIR, file),
    names.map((n) => modelBlocks[n]).join('\n\n') + '\n'
  );
  console.log('OK', file, names.length, 'modèles');
}

// Vérification finale : modèle de schéma manquant d'un partiel
const partialSet = new Set<string>();
for (const f of fs.readdirSync(MODELS_DIR)) {
  if (!f.endsWith('.prisma')) continue;
  for (const m of fs.readFileSync(path.join(MODELS_DIR, f), 'utf8').matchAll(/^model (\w+)/gm)) {
    partialSet.add(m[1]);
  }
}
const schemaSet = new Set(Object.keys(modelBlocks));
const missing = [...schemaSet].filter((m) => !partialSet.has(m));
if (missing.length > 0) throw new Error(`Modèles absents des partiels : ${missing.join(', ')}`);

console.log('ALL EDITS DONE — schéma + partiels synchronisés');

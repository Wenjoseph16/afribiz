const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ===== 1. Remove old Portfolio model =====
// Find and remove the old Portfolio model
const oldModelStart = c.indexOf('\nmodel Portfolio {');
const oldModelEnd = c.indexOf('\n\n', oldModelStart + 1);
// Find the actual end by finding @@index and closing brace
const idxStart = c.indexOf('model Portfolio {');
let depth = 0;
let pos = idxStart;
while (pos < c.length) {
  if (c[pos] === '{') depth++;
  if (c[pos] === '}') { depth--; if (depth === 0) { pos++; break; } }
  pos++;
}
const oldModel = c.substring(idxStart, pos);
console.log('Old model:', oldModel.split('\n')[0].trim());

// Remove old model
c = c.substring(0, idxStart) + c.substring(pos);

// ===== 2. Add new enums =====
// Find a good insertion point - before model PortfolioCategory will be inserted
// Add after PerformanceRating enum
const ratingEnd = c.indexOf('enum PerformanceRating {');
const ratingClose = c.indexOf('}', ratingEnd);
// Find the next model after the enum
const afterEnum = c.indexOf('\n\n', ratingClose + 1);

const newEnums = `

// ==================== PORTFOLIO ENUMS ====================
enum PortfolioMediaType {
  IMAGE
  VIDEO
  BEFORE_AFTER
  DOCUMENT
}

enum PortfolioInteractionType {
  LIKE
  SHARE
  COMMENT
  SAVE
}

`;

c = c.slice(0, afterEnum + 1) + newEnums + c.slice(afterEnum + 1);

// ===== 3. Add new models where old Portfolio was =====
// Find a good place - insert after the old Portfolio location (before whatever was after it)
// Find model ProductCategory as a reference point
const afterProducts = c.indexOf('\nmodel ProductCategory');

const newModels = `

// ==================== PORTFOLIO MANAGEMENT (Module 12) ====================

model PortfolioCategory {
  id            String          @id @default(uuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)

  name          String
  slug          String
  description   String?
  icon          String?
  image         String?
  parentId      String?
  parent        PortfolioCategory? @relation("PortfolioCategoryTree", fields: [parentId], references: [id])
  children      PortfolioCategory[] @relation("PortfolioCategoryTree")
  sortOrder     Int             @default(0)
  isActive      Boolean         @default(true)

  items         PortfolioItem[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([businessId, slug])
  @@index([businessId])
  @@index([parentId])
}

model PortfolioItem {
  id            String          @id @default(uuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  categoryId    String?
  category      PortfolioCategory? @relation(fields: [categoryId], references: [id])

  // Core
  title         String
  description   String?
  content       String?         // Rich text / detailed description

  // Media
  coverImage    String?         // Main thumbnail
  images        String[]        // Legacy support
  video         String?         // Video URL
  beforeImage   String?         // Before/after
  afterImage    String?

  // Project details
  clientName    String?
  location      String?
  budget        Decimal?        @db.Decimal(12, 2)
  currency      String          @default("FCFA")
  duration      String?         // e.g. "2 weeks", "3 months"
  resultsText   String?         // Results achieved

  // Metadata
  tags          String[]
  category      String?         // Legacy field, also linked via categoryId
  projectDate   DateTime?
  sortOrder     Int             @default(0)
  featured      Boolean         @default(false)
  isActive      Boolean         @default(true)

  // Interactions
  likesCount    Int             @default(0)
  viewsCount    Int             @default(0)
  sharesCount   Int             @default(0)

  // Relations
  media         PortfolioMedia[]
  interactions  PortfolioInteraction[]
  testimonials  PortfolioTestimonial[]  @relation("TestimonialItem")

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?

  @@index([businessId])
  @@index([categoryId])
  @@index([featured])
  @@index([sortOrder])
}

model PortfolioMedia {
  id            String            @id @default(uuid())
  portfolioItemId String
  portfolioItem  PortfolioItem    @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)

  type          PortfolioMediaType @default(IMAGE)
  url           String
  title         String?
  description   String?
  fileSize      Int?
  mimeType      String?
  width         Int?
  height        Int?
  sortOrder     Int               @default(0)
  isActive      Boolean           @default(true)

  createdAt     DateTime          @default(now())

  @@index([portfolioItemId])
  @@index([businessId])
}

model PortfolioInteraction {
  id            String                @id @default(uuid())
  portfolioItemId String
  portfolioItem  PortfolioItem        @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)
  businessId    String
  business      Business              @relation(fields: [businessId], references: [id], onDelete: Cascade)

  type          PortfolioInteractionType
  visitorId     String?               // Anonymous or user ID
  visitorName   String?               // For comments
  comment       String?               // If type is COMMENT
  metadata      Json?

  createdAt     DateTime              @default(now())

  @@index([portfolioItemId])
  @@index([businessId])
  @@index([type])
}

model PortfolioTestimonial {
  id            String            @id @default(uuid())
  businessId    String
  business      Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  portfolioItemId String?
  portfolioItem  PortfolioItem?   @relation("TestimonialItem", fields: [portfolioItemId], references: [id])

  clientName    String
  clientPhoto   String?
  clientCompany String?
  text          String
  rating        Int?              @default(5)   // 1-5
  projectDate   DateTime?         // When the project was done
  isPinned      Boolean           @default(false)
  isActive      Boolean           @default(true)
  sortOrder     Int               @default(0)

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([businessId])
  @@index([portfolioItemId])
  @@index([isPinned])
}

`;

c = c.slice(0, afterProducts) + newModels + c.slice(afterProducts);

// ===== 4. Remove old portfolioItems relation from Business and add new ones =====
// The old relation is `portfolioItems    Portfolio[]`
c = c.replace(
  '  portfolioItems    Portfolio[]',
  '  portfolioItems    PortfolioItem[]\n  portfolioCategories PortfolioCategory[]\n  portfolioMedia    PortfolioMedia[]\n  portfolioInteractions PortfolioInteraction[]\n  portfolioTestimonials PortfolioTestimonial[]'
);

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Portfolio schema updated successfully');

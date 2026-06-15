-- ============================================
-- PostgreSQL Full-Text Search Indexes
-- Run this manually after schema sync:
--   npx prisma db execute --file prisma/migrations/add_fulltext_indexes.sql
-- ============================================

-- === BUSINESS ===
CREATE INDEX IF NOT EXISTS idx_business_fts ON "Business"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("description", '') || ' ' || coalesce("shortDescription", '') || ' ' || coalesce("city", '') || ' ' || coalesce("slug", '')));

-- === USER ===
CREATE INDEX IF NOT EXISTS idx_user_fts ON "User"
  USING GIN (to_tsvector('french', coalesce("firstName", '') || ' ' || coalesce("lastName", '') || ' ' || coalesce("email", '')));

-- === PRODUCT ===
CREATE INDEX IF NOT EXISTS idx_product_fts ON "Product"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("description", '')));

-- === SERVICE ===
CREATE INDEX IF NOT EXISTS idx_service_fts ON "Service"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("description", '')));

-- === MENU_ITEM ===
CREATE INDEX IF NOT EXISTS idx_menuitem_fts ON "MenuItem"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("description", '')));

-- === EVENT ===
CREATE INDEX IF NOT EXISTS idx_event_fts ON "Event"
  USING GIN (to_tsvector('french', coalesce("title", '') || ' ' || coalesce("description", '')));

-- === RENTAL ===
CREATE INDEX IF NOT EXISTS idx_rental_fts ON "Rental"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("description", '')));

-- === DEVELOPER_MODULE ===
CREATE INDEX IF NOT EXISTS idx_developer_module_fts ON "DeveloperModule"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("description", '') || ' ' || coalesce("fullDescription", '') || ' ' || coalesce("category", '')));

-- === DEVELOPER_PROFILE ===
CREATE INDEX IF NOT EXISTS idx_developer_profile_fts ON "DeveloperProfile"
  USING GIN (to_tsvector('french', coalesce("companyName", '') || ' ' || coalesce("companyName", '') || ' ' || coalesce("description", '') || ' ' || coalesce("city", '') || ' ' || coalesce("country", '')));

-- === BOOKING ===
CREATE INDEX IF NOT EXISTS idx_booking_fts ON "Booking"
  USING GIN (to_tsvector('french', coalesce("customerName", '') || ' ' || coalesce("title", '')));

-- === QUOTE ===
CREATE INDEX IF NOT EXISTS idx_quote_fts ON "Quote"
  USING GIN (to_tsvector('french', coalesce("clientName", '') || ' ' || coalesce("quoteNumber", '')));

-- === INVOICE ===
CREATE INDEX IF NOT EXISTS idx_invoice_fts ON "Invoice"
  USING GIN (to_tsvector('french', coalesce("clientName", '') || ' ' || coalesce("invoiceNumber", '')));

-- === AD_CAMPAIGN ===
CREATE INDEX IF NOT EXISTS idx_ad_campaign_fts ON "AdCampaign"
  USING GIN (to_tsvector('french', coalesce("name", '') || ' ' || coalesce("companyName", '')));

-- === DISPUTE ===
CREATE INDEX IF NOT EXISTS idx_dispute_fts ON "Dispute"
  USING GIN (to_tsvector('french', coalesce("title", '')));

-- === BUSINESS_DOCUMENT ===
CREATE INDEX IF NOT EXISTS idx_business_document_fts ON "BusinessDocument"
  USING GIN (to_tsvector('french', coalesce("title", '')));

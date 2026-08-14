import 'tsconfig-paths/register';
import express from 'express';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as Sentry from '@sentry/node';
import type { ApiResponse } from '@afribiz/shared';
import { config } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter, sensitiveLimiter } from './middlewares/rateLimiter';
import { auditLogMiddleware } from './middlewares/auditLog';
import { csrfProtection } from './middlewares/csrf';
import { sanitizeInput } from './middlewares/sanitize';
import { apiVersioning } from './middlewares/apiVersion';
import { correlationId } from './middlewares/correlationId';
import { metricsMiddleware, metricsHandler } from './middlewares/metrics';
import { maintenanceMode, resetMaintenanceCache } from './middlewares/maintenanceMode';
import { maintenanceStatus as maintenanceStatusHandler } from './controllers/health';
import { initTracing } from './lib/tracing';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import {
  healthRoutes,
  authRoutes,
  usersRoutes,
  notificationRoutes,
  ordersRoutes,
  clientOrdersRoutes,
  clientBookingsRoutes,
  paymentsRoutes,
  favoritesRoutes,
  followRoutes,
  socialAccountRoutes,
  alertRoutes,
  savedItemRoutes,
  postRoutes,
  feedRoutes,
  recommendationRoutes,
  smartSearchRoutes,
  growthEngineRoutes,
  attentionRoutes,
  opportunityRoutes,
  marketNeedRoutes,
  marketIdeaRoutes,
  clientIntelligenceRoutes,
  growthCoachingRoutes,
  matchingRoutes,
  dashboardRoutes,
  commentRoutes,
  contentReportRoutes,
  reviewsRoutes,
  satisfactionRoutes,
  marketingRoutes,
  messagesRoutes,
  businessRoutes,
  productRoutes,
  serviceRoutes,
  roomRoutes,
  menuRoutes,
  bookingsRoutes as bookingRoutes,
  quotesInvoicesRoutes,
  debtsPaymentsRoutes,
  planningRoutes,
  promotionsRoutes,
  employeesRoutes,
  portfolioRoutes,
  subscriptionsRoutes,
  employeeLeavesRoutes,
  payrollRoutes,
  deliveryRoutes,
  eventsRoutes,
  disputesRoutes,
  accountingRoutes,
  accountingAdvancedRoutes,
  signatureRoutes,
  rentalsRoutes,
  developerRoutes,
  marketplaceRoutes,
  adsRoutes,
  afriScoreRoutes,
  gamificationRoutes,
  adminRoutes,
  trainingRoutes,
  trainingAdvancedRoutes,
  paymentsProcessorRoutes,
  simulationRoutes,
  publicBookingsRoutes,
  clientEventsRoutes,
  publicQuotesRoutes,
  advancedTasksRoutes,
  partnerRoutes,
  cartRoutes,
  referralRoutes,
  loyaltyRoutes,
  walletRoutes,
  trainingBusinessRoutes,
  documentBusinessRoutes,
  crmRoutes,
  customer360Routes,
  automationCrmRoutes,
  dataHubAnalyticsRoutes,
  notificationTemplatesRoutes,
  cronJobsRoutes,
  twoFactorRoutes,
  storyRoutes,
  liveRoutes,
  shortRoutes,
  offerFlashRoutes,
  reactionsRoutes,
  uploadRoutes,
  mediaCommerceRoutes,
  publicBusinessRoutes,
  hybridPaymentRoutes,
  adminFinanceRoutes,
  clientPromotionsRoutes,
  fedaPayWebhookRoutes,
  stripeWebhookRoutes,
  gdprRoutes,
  escrowBusinessRoutes,
  escrowClientRoutes,
  verificationRoutes,
  savingsGroupRoutes,
  africanUnitRoutes,
  agentNetworkRoutes,
  groupBuyRoutes,
  catalogAttachmentRoutes,
  supplierRoutes,
  affiliateRoutes,
  taxRoutes,
  whatsappRoutes,
  whatsappWebhookRoutes,
  trackingRoutes,
  layawayRoutes,
  offlineSyncRoutes,
  voiceCatalogueRoutes,
  ussdRoutes,
  vocalRoutes,
  searchRoutes,
  copilotRoutes,
  clientQuotesInvoicesRoutes,
} from './routes';
import { registerNotificationHandlers } from './events/handlers/notificationHandler';
import { registerAdminEventHandlers } from './events/handlers/adminEventHandler';
import { registerFeedHandlers } from './events/handlers/feedHandler';
import { registerBusinessRoomHandlers } from './events/handlers/businessRoomHandler';
import { registerAutomationHandlers } from './services/advancedTasks';
import { registerLoyaltyAutomation } from './services/LoyaltyAutomation';
import { CronService } from './services/CronService';
import { RuleEngineService } from './services/RuleEngineService';
import { CampaignEngineService } from './services/CampaignEngineService';
import { replayPendingEvents } from './events/replay';
import { initCache } from './lib/cache';
import { initSocket } from './services/socket';
import { warmCopilotCache } from './services/businessCopilot';

// Sentry initialization
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 0,
    profilesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 0,
    integrations: [Sentry.expressIntegration()],
  });
}

const app = express();
const httpServer = http.createServer(app);

// Security Middleware — Headers de sécurité renforcés
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.afribiz.com'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", config.FRONTEND_URL || 'http://localhost:3000'],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity:
      config.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    hidePoweredBy: true,
    noSniff: true,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    xssFilter: true,
  })
);

// Permission Policy — restreindre les APIs navigateur
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), display-capture=(), ' +
      'fullscreen=(self), clipboard-write=(self), clipboard-read=(), ' +
      'interest-cohort=(), browsing-topics=()'
  );
  next();
});
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

// API Versioning — adds X-API-Version header to all responses
app.use('/api', apiVersioning);

// Global Rate Limiting — Applied to all /api/* routes
app.use('/api', apiLimiter);

// Audit logging for security-critical events
app.use('/api', auditLogMiddleware);

// Compression (gzip/brotli)
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// Correlation ID for request tracing
app.use(correlationId);

// Metrics — Prometheus-compatible endpoint
app.use('/api', metricsMiddleware);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// XSS Sanitization — strips HTML/script tags from all user input
app.use('/api', sanitizeInput);

// Logging Middleware — sanitized (masque les données sensibles)
app.use((req, res, next) => {
  const sensitivePaths = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-otp',
    '/api/auth/2fa',
  ];
  const isSensitive = sensitivePaths.some((p) => req.path.startsWith(p));
  logger.info(`${req.method} ${req.path}`, {
    query: isSensitive ? '[REDACTED]' : req.query,
    ip: req.ip?.replace(/\d+\.\d+\.\d+(\.\d+)/, (_, last) => `xxx.xxx.xxx${last}`),
    userAgent: req.headers['user-agent']?.substring(0, 80),
  });
  next();
});

// Auth & health routes (exempted from CSRF — JWT/Bearer already protects them)
// Swagger API Documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'AfriBiz API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

// JSON endpoint for OpenAPI spec (e.g., for Postman import)
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/health', healthRoutes);
// Statut de maintenance public — toujours accessible (exclu du middleware)
app.get('/api/public/maintenance-status', maintenanceStatusHandler);
app.get('/api/metrics', metricsHandler);
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);

// FedaPay Webhook (before CSRF — FedaPay doesn't send CSRF tokens)
app.use('/api/payments', fedaPayWebhookRoutes);
app.use('/api/payments', stripeWebhookRoutes);

// WhatsApp Webhook (before CSRF — Meta sends callbacks without CSRF token)
app.use('/api/whatsapp', whatsappWebhookRoutes);

// Campaign tracking — public (clicks from WhatsApp/SMS/email, no auth, before CSRF)
app.use('/api/track', trackingRoutes);

// CSRF Protection — double-submit cookie pattern
// Sets csrf-token cookie on GET; validates x-csrf-token header on POST/PUT/PATCH/DELETE
app.use('/api', csrfProtection);

// Mode maintenance — 503 partout sauf /admin /auth /health /metrics
app.use('/api', maintenanceMode);

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications/templates', notificationTemplatesRoutes);
app.use('/api/business/orders', ordersRoutes);
app.use('/api/orders', clientOrdersRoutes);
app.use('/api/bookings', clientBookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payments/escrow/client', escrowClientRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/layaway', layawayRoutes);
app.use('/api/social', socialAccountRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/saves', savedItemRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search', smartSearchRoutes);
app.use('/api/growth', growthEngineRoutes);
app.use('/api/attention', attentionRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/market/needs', marketNeedRoutes);
app.use('/api/market/ideas', marketIdeaRoutes);
app.use('/api/client-intelligence', clientIntelligenceRoutes);
app.use('/api/growth-coaching', growthCoachingRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', contentReportRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/satisfaction', satisfactionRoutes);
app.use('/api/messages', messagesRoutes);
// Comptabilité (doit être AVANT businessRoutes pour éviter que le requireRole de businessRoutes n'intercepte les requêtes qui tombent dans le routeur suivant)
app.use('/api/business/accounting', accountingRoutes);
app.use('/api/business/accounting/reports', accountingAdvancedRoutes);

// ⚠️ subscriptionsRoutes doit être monté AVANT businessRoutes : ce dernier a un
// router.use(requireRole(['BUSINESS','ADMIN'])) global qui bloquerait sinon les
// endpoints client (/subscribe, /my-subscription) pour les rôles CLIENT/DEVELOPER.
app.use('/api/business/subscriptions', subscriptionsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/business/products', productRoutes);
app.use('/api/business/services', serviceRoutes);
app.use('/api/business/rooms', roomRoutes);
app.use('/api/business/menu', menuRoutes);
app.use('/api/business/bookings', bookingRoutes);
app.use('/api/business/disputes', disputesRoutes);
app.use('/api/business/finance', sensitiveLimiter, quotesInvoicesRoutes);

app.use('/api/business/finance', sensitiveLimiter, debtsPaymentsRoutes);
app.use('/api/business/finance/escrow', escrowBusinessRoutes);
app.use('/api/business/planning', planningRoutes);
app.use('/api/business/promotions', promotionsRoutes);
app.use('/api/business/employees', employeesRoutes);
app.use('/api/business/employees/leaves', employeeLeavesRoutes);
app.use('/api/business/employees/payroll', payrollRoutes);
app.use('/api/business/portfolio', portfolioRoutes);
app.use('/api/business/delivery', deliveryRoutes);
app.use('/api/business/events', eventsRoutes);
app.use('/api/events', clientEventsRoutes);
app.use('/api/business/rentals', rentalsRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/business/marketing', marketingRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/trainings/advanced', trainingAdvancedRoutes);
app.use('/api/trainings/business', trainingBusinessRoutes);
app.use('/api/business/documents', documentBusinessRoutes);
app.use('/api/payments/processor', paymentsProcessorRoutes);
app.use('/api/sandbox', simulationRoutes);
// Stories & Feed (Phase 1 — Social Commerce)
app.use('/api', storyRoutes);

// Live Commerce (Phase 2)
app.use('/api', liveRoutes);

// Shorts Business (Phase 3)
app.use('/api', shortRoutes);

// Media uploads (Stories, Shorts, Live covers, etc.)
app.use('/api', uploadRoutes);
app.use('/api', mediaCommerceRoutes);

// Message reactions
app.use('/api', reactionsRoutes);

// Offres Flash & Géolocalisation (Phase 4)
app.use('/api', offerFlashRoutes);

// Public business page (no auth required)
app.use('/api', publicBusinessRoutes);

app.use('/api', afriScoreRoutes);
app.use('/api', adminRoutes);
app.use('/api', gamificationRoutes);
app.use('/api/public', sensitiveLimiter, publicBookingsRoutes);
app.use('/api/public', sensitiveLimiter, publicQuotesRoutes);

// Cart & Checkout
app.use('/api/cart', cartRoutes);

// Referral / Parrainage
app.use('/api/referral', referralRoutes);

// Wallet
app.use('/api/wallet', walletRoutes);

// Loyalty / Fidelity (client-facing)
app.use('/api/loyalty', loyaltyRoutes);

// Promotions client-facing (catalogue public + programme fidélité client)
app.use('/api/promotions', clientPromotionsRoutes);

// Client-facing invoices & quotes (accessible par CLIENT)
app.use('/api/client/finance', clientQuotesInvoicesRoutes);

// Comptabilité (Module Dépenses)
app.use('/api/copilot', copilotRoutes);
app.use('/api/gdpr', gdprRoutes);
// Signature électronique
app.use('/api/documents', signatureRoutes);

// CRM (Module 11)
app.use('/api/business/crm', crmRoutes);

// Customer 360° — tracking + aggregation
app.use('/api/business/crm', customer360Routes);

// CRM Automation Engine
app.use('/api/business/crm/automation', automationCrmRoutes);

// Data Hub Analytics & Copilot (nouveaux services)
app.use('/api', dataHubAnalyticsRoutes);

// Paiements hybrides (plusieurs méthodes par commande) + Escrow par étapes
app.use('/api', hybridPaymentRoutes);

// Dashboard Admin — Finance (transactions, escrows, fraudes)
app.use('/api', adminFinanceRoutes);

// Automations status endpoint
app.use('/api/cron-jobs', cronJobsRoutes);

// Advanced Tasks routes
app.use('/api/business/tasks', advancedTasksRoutes);

app.use('/api/business/partners', partnerRoutes);
app.use('/api/business/verification', verificationRoutes);

// ============================================
// PHASE 4 — INNOVATIONS AFRICAINES
// ============================================

// 4.2 — Tontine / Épargne Collective
app.use('/api/business/savings-groups', savingsGroupRoutes);

// 4.4 — Unités de mesure africaines
app.use('/api/units', africanUnitRoutes);

// 4.6 — Agents Network
app.use('/api/business/agents', agentNetworkRoutes);

// 4.7 — Achat Groupé
app.use('/api/business/group-buys', groupBuyRoutes);

// 4.8 — Rattachements catalogue (taxe, quantité min/max, dispo, perso, cadeau, croisées, créneau, urgence)
app.use('/api/business/catalog-attachments', catalogAttachmentRoutes);
app.use('/api/business/suppliers', supplierRoutes);
app.use('/api/affiliate', affiliateRoutes);

// 4.5 — Taxes multi-pays ZLECAF
app.use('/api/taxes', taxRoutes);

// 4.3 — Mode Hors-ligne / PWA
app.use('/api/sync', offlineSyncRoutes);

// 4.8 — Catalogue Vocal
app.use('/api/voice', voiceCatalogueRoutes);

// 4.9 — USSD
app.use('/api/ussd', ussdRoutes);

// 4.10 — Vocal STT (Speech-to-Text)
app.use('/api/vocal', vocalRoutes);

app.use('/api/whatsapp', whatsappRoutes);

// Global Search (unified across business entities)
app.use('/api/business/search', searchRoutes);

// Cache initialization
initCache(config.REDIS_URL);

// Register event handlers
registerNotificationHandlers();
registerAdminEventHandlers();

// Register feed auto-population handlers
registerFeedHandlers();

// Register realtime business dashboard push (socket room business:{id})
registerBusinessRoomHandlers();

// Register task automation handlers
registerAutomationHandlers();

// Register loyalty points automation (credits points on order/payment)
registerLoyaltyAutomation();

// Start cron jobs for scheduled automations
CronService.start();

// Start Rule Engine for event-driven automations (Phase 5)
RuleEngineService.start();

// Start Campaign Engine for multi-step marketing sequences (Phase 5 Extension 3)
CampaignEngineService.start();

// Initialize OpenTelemetry tracing
initTracing();

// Replay any events that were persisted but not processed (crash recovery)
replayPendingEvents().then((count) => {
  if (count > 0) logger.info(`EventBus: ${count} pending events replayed from queue`);
});

// 404 handler
app.use((req, res) => {
  const body: ApiResponse<never> = { success: false, error: 'Route introuvable' };
  res.status(404).json(body);
});

// Sentry error handler (before express error handler)
if (config.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error Handler (must be last)
app.use(errorHandler);

initSocket(httpServer);

// Warm copilot cache in background (non-blocking)
warmCopilotCache().catch((error) => {
  logger.warn(`Copilot warmup skipped: ${error instanceof Error ? error.message : String(error)}`);
});

const PORT = config.PORT;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT} (HTTP + WebSocket)`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

process.on('unhandledRejection', (reason) => {
  logger.warn(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error instanceof Error ? error.message : String(error)}`);
});

export default app;

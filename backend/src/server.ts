import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as Sentry from '@sentry/node';
import { config } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter, sensitiveLimiter } from './middlewares/rateLimiter';
import { csrfProtection } from './middlewares/csrf';
import { sanitizeInput } from './middlewares/sanitize';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import notificationRoutes from './routes/notification';
import ordersRoutes from './routes/orders';
import clientOrdersRoutes from './routes/client-orders';
import clientBookingsRoutes from './routes/client-bookings';
import paymentsRoutes from './routes/payments';
import favoritesRoutes from './routes/favorites';
import reviewsRoutes from './routes/reviews';
import marketingRoutes from './routes/marketing';
import messagesRoutes from './routes/messages';
import businessRoutes from './routes/business';
import productRoutes from './routes/product';
import serviceRoutes from './routes/service';
import roomRoutes from './routes/room';
import menuRoutes from './routes/menu';
import bookingRoutes from './routes/bookings';
import quotesInvoicesRoutes from './routes/quotesInvoices';
import debtsPaymentsRoutes from './routes/debtsPayments';
import planningRoutes from './routes/planning';
import promotionsRoutes from './routes/promotions';
import employeesRoutes from './routes/employees';
import portfolioRoutes from './routes/portfolio';
import subscriptionsRoutes from './routes/subscriptions';
import deliveryRoutes from './routes/delivery';
import eventsRoutes from './routes/events';
import accountingRoutes from './routes/accounting';
import accountingAdvancedRoutes from './routes/accountingAdvanced';
import signatureRoutes from './routes/signatureRoutes';
import rentalsRoutes from './routes/rentals';
import developerRoutes from './routes/developer';
import marketplaceRoutes from './routes/marketplace';
import adsRoutes from './routes/ads';
import afriScoreRoutes from './routes/afriScore';
import adminRoutes from './routes/admin';
import trainingRoutes from './routes/training';
import trainingAdvancedRoutes from './routes/trainingAdvanced';
import paymentsProcessorRoutes from './routes/paymentsProcessor';
import simulationRoutes from './routes/simulation';
import publicBookingsRoutes from './routes/public-bookings';
import clientEventsRoutes from './routes/client-events';
import publicQuotesRoutes from './routes/public-quotes';
import advancedTasksRoutes from './routes/advancedTasks';
import partnerRoutes from './routes/partner';
import cartRoutes from './routes/cart';
import referralRoutes from './routes/referral';
import loyaltyRoutes from './routes/loyalty';
import walletRoutes from './routes/wallet';
import trainingBusinessRoutes from './routes/trainingBusiness';
import documentBusinessRoutes from './routes/documentBusiness';
import crmRoutes from './routes/crm';
import customer360Routes from './routes/customer360';
import dataHubAnalyticsRoutes from './routes/dataHubAnalytics';
import notificationTemplatesRoutes from './routes/notificationTemplates';
import twoFactorRoutes from './routes/twoFactor';
import storyRoutes from './routes/storyRoutes';
import liveRoutes from './routes/liveRoutes';
import shortRoutes from './routes/shortRoutes';
import offerFlashRoutes from './routes/offerFlashRoutes';
import uploadRoutes from './routes/uploadRoutes';
import mediaCommerceRoutes from './routes/mediaCommerceRoutes';
import publicBusinessRoutes from './routes/public-business';
import hybridPaymentRoutes from './routes/hybridPayment';
import adminFinanceRoutes from './routes/adminFinance';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { registerNotificationHandlers } from './events/handlers/notificationHandler';
import { registerAutomationHandlers } from './services/advancedTasks';
import { registerLoyaltyAutomation } from './services/LoyaltyAutomation';
import { CronService } from './services/CronService';
import { replayPendingEvents } from './events/replay';
import { initCache } from './lib/cache';
import { initSocket } from './services/socket';

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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.afribiz.com"],
      fontSrc: ["'self'", "data:", "fonts.gstatic.com"],
      connectSrc: ["'self'", config.FRONTEND_URL || 'http://localhost:3000', "https://*.sentry.io"],
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
  strictTransportSecurity: config.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // Désactiver X-Powered-By (déjà fait mais on insiste)
  hidePoweredBy: true,
  // X-Content-Type-Options: nosniff
  noSniff: true,
  // X-DNS-Prefetch-Control: off
  dnsPrefetchControl: { allow: false },
  // X-Download-Options: noopen (IE)
  ieNoOpen: true,
  // X-XSS-Protection (déprécié mais utile pour IE/legacy)
  xssFilter: true,
}));

// Permission Policy — restreindre les APIs navigateur
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), display-capture=(), '
    + 'fullscreen=(self), clipboard-write=(self), clipboard-read=(), '
    + 'interest-cohort=(), browsing-topics=()'
  );
  next();
});
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Global Rate Limiting — Applied to all /api/* routes
app.use('/api', apiLimiter);

// HTTP Parameter Pollution protection — garder le dernier paramètre
app.use((_req, _res, next) => {
  next();
});

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// XSS Sanitization — strips HTML/script tags from all user input
app.use('/api', sanitizeInput);

// Logging Middleware — sanitized (masque les données sensibles)
app.use((req, res, next) => {
  const sensitivePaths = ['/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password',
    '/api/auth/reset-password', '/api/auth/verify-otp', '/api/auth/2fa'];
  const isSensitive = sensitivePaths.some(p => req.path.startsWith(p));
  logger.info(`${req.method} ${req.path}`, {
    query: isSensitive ? '[REDACTED]' : req.query,
    ip: req.ip?.replace(/\d+\.\d+\.\d+(\.\d+)/, (_, last) => `xxx.xxx.xxx${last}`),
    userAgent: req.headers['user-agent']?.substring(0, 80),
  });
  next();
});

// Auth & health routes (exempted from CSRF — JWT/Bearer already protects them)
// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'AfriBiz API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// JSON endpoint for OpenAPI spec (e.g., for Postman import)
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);

// CSRF Protection — double-submit cookie pattern
// Sets csrf-token cookie on GET; validates x-csrf-token header on POST/PUT/PATCH/DELETE
app.use('/api', csrfProtection);

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications/templates', notificationTemplatesRoutes);
app.use('/api/business/orders', ordersRoutes);
app.use('/api/orders', clientOrdersRoutes);
app.use('/api/bookings', clientBookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/business/products', productRoutes);
app.use('/api/business/services', serviceRoutes);
app.use('/api/business/rooms', roomRoutes);
app.use('/api/business/menu', menuRoutes);
app.use('/api/business/bookings', bookingRoutes);


app.use('/api/business/finance', sensitiveLimiter, quotesInvoicesRoutes);
app.use('/api/business/finance', sensitiveLimiter, debtsPaymentsRoutes);
app.use('/api/business/planning', planningRoutes);
app.use('/api/business/promotions', promotionsRoutes);
app.use('/api/business/employees', employeesRoutes);
app.use('/api/business/portfolio', portfolioRoutes);
app.use('/api/business/subscriptions', subscriptionsRoutes);
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

// Offres Flash & Géolocalisation (Phase 4)
app.use('/api', offerFlashRoutes);

// Public business page (no auth required)
app.use('/api', publicBusinessRoutes);

app.use('/api', afriScoreRoutes);
app.use('/api', adminRoutes);
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

// Comptabilité (Module Dépenses)
app.use('/api/business/accounting', accountingRoutes);
app.use('/api/business/accounting/reports', accountingAdvancedRoutes);

// Signature électronique
app.use('/api/documents', signatureRoutes);

// CRM (Module 11)
app.use('/api/business/crm', crmRoutes);

// Customer 360° — tracking + aggregation
app.use('/api/business/crm', customer360Routes);

// Data Hub Analytics & Copilot (nouveaux services)
app.use('/api', dataHubAnalyticsRoutes);

// Paiements hybrides (plusieurs méthodes par commande) + Escrow par étapes
app.use('/api', hybridPaymentRoutes);

// Dashboard Admin — Finance (transactions, escrows, fraudes)
app.use('/api', adminFinanceRoutes);

// Advanced Tasks routes
app.use('/api/business/tasks', advancedTasksRoutes);

app.use('/api/business/partners', partnerRoutes);

// Cache initialization
initCache(config.REDIS_URL);

// Register event handlers
registerNotificationHandlers();

// Register task automation handlers
registerAutomationHandlers();

// Register loyalty points automation (credits points on order/payment)
registerLoyaltyAutomation();

// Start cron jobs for scheduled automations
CronService.start();

// Replay any events that were persisted but not processed (crash recovery)
replayPendingEvents().then(count => {
  if (count > 0) logger.info(`EventBus: ${count} pending events replayed from queue`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route introuvable',
  });
});

// Sentry error handler (before express error handler)
if (config.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error Handler (must be last)
app.use(errorHandler);

const io = initSocket(httpServer);

const PORT = config.PORT;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT} (HTTP + WebSocket)`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

export default app;

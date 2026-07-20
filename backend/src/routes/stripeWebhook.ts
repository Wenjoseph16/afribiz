import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/stripeWebhook';
import { webhookLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Stripe webhook endpoint - no auth middleware (signed with webhook secret)
// Stripe sends POST events here
// Rate limited to 30 req/min via webhookLimiter
router.post('/stripe/webhook', webhookLimiter, handleStripeWebhook);

export default router;

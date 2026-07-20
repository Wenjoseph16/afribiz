import { Router } from 'express';
import { handleFedaPayWebhook } from '../controllers/fedaPayWebhook';
import { webhookLimiter } from '../middlewares/rateLimiter';

const router = Router();

// FedaPay webhook endpoint - no auth middleware (signed with webhook secret)
// FedaPay sends POST to this URL when transaction status changes
// Rate limited to 30 req/min via webhookLimiter
router.post('/fedapay/webhook', webhookLimiter, handleFedaPayWebhook);

export default router;

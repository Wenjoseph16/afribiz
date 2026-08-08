import { Router } from 'express';
import { trackCampaignAction } from '../controllers/trackingController';
import { strictLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Tracking public de campagnes — PAS d'authMiddleware (les liens sont cliqués
// par des visiteurs non connectés depuis WhatsApp/SMS/email).
// Rate-limit IP (20 req/15 min) pour empêcher de gonfler les stats d'une campagne.
router.get('/campaign/:id', strictLimiter, trackCampaignAction);

export default router;

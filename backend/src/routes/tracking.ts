import { Router } from 'express';
import { trackCampaignAction } from '../controllers/trackingController';

const router = Router();

// Tracking public de campagnes — PAS d'authMiddleware (les liens sont cliqués
// par des visiteurs non connectés depuis WhatsApp/SMS/email).
router.get('/campaign/:id', trackCampaignAction);

export default router;

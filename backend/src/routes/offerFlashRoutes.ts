import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  getActiveOffers, getOfferById, createOffer, updateOffer,
  deleteOffer, claimOffer, getNearbyBusinesses,
} from '../controllers/offerFlashController';

const router = Router();

// Routes publiques
router.get('/offers', getActiveOffers);
router.get('/offers/:id', getOfferById);
router.post('/offers/:id/claim', claimOffer);
router.get('/businesses/nearby', getNearbyBusinesses);

// Routes authentifiées (BUSINESS, DEVELOPER ou ADMIN)
router.post('/offers', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), createOffer);
router.put('/offers/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), updateOffer);
router.delete('/offers/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), deleteOffer);

export default router;

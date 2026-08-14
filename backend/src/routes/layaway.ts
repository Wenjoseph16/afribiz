import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createOffer,
  createOffersBatch,
  listOffers,
  toggleOffer,
  deleteOffer,
  businessPlans,
  businessStats,
  activeOffer,
  activeOffersBatch,
  createPlan,
  myPlans,
  getPlan,
  contribute,
  cancelPlan,
  confirmCheckout,
} from '../controllers/layawayController';

const router = Router();

// ── Public : badge dispo sur une fiche article (avant auth — marché pour visiteurs) ──
router.get('/offers/active', activeOffer);
router.get('/offers/batch', activeOffersBatch);

// Toutes les routes suivantes nécessitent une authentification
router.use(authMiddleware);

// ── Business : offres d'épargne ──
router.post('/offers', createOffer);
router.post('/offers/batch', createOffersBatch);
router.get('/offers', listOffers);
router.patch('/offers/:id', toggleOffer);
router.delete('/offers/:id', deleteOffer);
router.get('/business/plans', businessPlans);
router.get('/business/stats', businessStats);

// ── Client : plans d'épargne ──
router.get('/my-plans', myPlans);
router.get('/plans/:id', getPlan);
router.post('/plans', createPlan);
router.post('/plans/:id/contribute', contribute);
router.post('/plans/:id/cancel', cancelPlan);
router.post('/plans/:id/confirm', confirmCheckout);

export default router;

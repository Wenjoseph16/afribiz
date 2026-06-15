import { Router } from 'express';
import { getPublicBusiness, getBusinessProducts, getBusinessServices, getBusinessMenu, getBusinessRooms, getBusinessEvents, getBusinessRentals, getBusinessPortfolio, getBusinessPromotions, getBusinessPartners, getBusinessReviews, getMyBusiness, getMyBusinessClients, getMyBusinessStats, getAggregatedStats, createBusiness, toggleBusinessModule, updatePublicPage, getPublicPagePreview, listBusinessDocuments, getBusinessDocument, createBusinessDocument, updateBusinessDocument, deleteBusinessDocument, listBusinessDisputes, getBusinessDispute, createBusinessDispute, updateBusinessDispute, getBusinessInstalledModules, submitBusinessVerification, getBusinessCommissionStats, getBusinessPaymentMethods, addBusinessPaymentMethod, updateBusinessPaymentMethod, deleteBusinessPaymentMethod } from '../controllers/business';
import { getPublicEvent, registerPublicParticipant } from '../controllers/events';
import { searchAll } from '../controllers/search';
import { validateBody } from '../middlewares/validators';
import { onboardingSchema, publicPageSchema, businessVerificationSchema } from '../validators/business';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/:slug/public', getPublicBusiness);
router.get('/:slug/products', getBusinessProducts);
router.get('/:slug/services', getBusinessServices);
router.get('/:slug/menu', getBusinessMenu);
router.get('/:slug/rooms', getBusinessRooms);
router.get('/:slug/events', getBusinessEvents);
router.get('/:slug/events/:eventId', getPublicEvent);
router.post('/:slug/events/:eventId/register', registerPublicParticipant);
router.get('/:slug/rentals', getBusinessRentals);
router.get('/:slug/portfolio', getBusinessPortfolio);
router.get('/:slug/promotions', getBusinessPromotions);
router.get('/:slug/partners', getBusinessPartners);
router.get('/:slug/reviews', getBusinessReviews);

// Protected routes
router.get('/modules/installed', authMiddleware, getBusinessInstalledModules);
router.get('/me', authMiddleware, getMyBusiness);
  router.get('/clients', authMiddleware, getMyBusinessClients);
  router.get('/stats', authMiddleware, getMyBusinessStats);
router.get('/stats/aggregated', authMiddleware, getAggregatedStats);
router.get('/finance/stats', authMiddleware, getBusinessCommissionStats);
router.post('/onboarding', authMiddleware, validateBody(onboardingSchema), createBusiness);
router.put('/public-page', authMiddleware, validateBody(publicPageSchema), updatePublicPage);
router.get('/public-page-preview', authMiddleware, getPublicPagePreview);
router.patch('/modules/toggle', authMiddleware, toggleBusinessModule);

// Payment Methods
router.get('/payment-methods', authMiddleware, getBusinessPaymentMethods);
router.post('/payment-methods', authMiddleware, addBusinessPaymentMethod);
router.put('/payment-methods/:id', authMiddleware, updateBusinessPaymentMethod);
router.delete('/payment-methods/:id', authMiddleware, deleteBusinessPaymentMethod);

// Documents
router.get('/documents', authMiddleware, listBusinessDocuments);
router.get('/documents/:id', authMiddleware, getBusinessDocument);
router.post('/documents', authMiddleware, createBusinessDocument);
router.put('/documents/:id', authMiddleware, updateBusinessDocument);
router.delete('/documents/:id', authMiddleware, deleteBusinessDocument);

// Disputes
router.get('/disputes', authMiddleware, listBusinessDisputes);
router.get('/disputes/:id', authMiddleware, getBusinessDispute);
router.post('/disputes', authMiddleware, createBusinessDispute);
router.put('/disputes/:id', authMiddleware, updateBusinessDispute);

// Verification / KYC
router.post('/verification', authMiddleware, validateBody(businessVerificationSchema), submitBusinessVerification);

export default router;

import { Router } from 'express';
import {
  getBossCockpitOverview,
  getSingleBusinessCockpit,
} from '../controllers/bossCockpitController';
import {
  getPublicBusiness,
  getBusinessProducts,
  getBusinessServices,
  getBusinessMenu,
  getBusinessRooms,
  getBusinessEvents,
  getBusinessRentals,
  getBusinessPortfolio,
  getBusinessPromotions,
  getBusinessPartners,
  getBusinessReviews,
  createBusinessReview,
  getBusinessBookings,
  getBusinessTrainings,
  getBusinessSubscriptionPlans,
  getMyBusiness,
  getMyBusinessPlan,
  getMyBusinessAlertQueue,
  getMyBusinessClients,
  getMyBusinessStats,
  getAggregatedStats,
  createBusiness,
  toggleBusinessModule,
  updatePublicPage,
  getPublicPagePreview,
  listBusinessDocuments,
  getBusinessDocument,
  createBusinessDocument,
  updateBusinessDocument,
  deleteBusinessDocument,
  listBusinessDisputes,
  getBusinessDispute,
  createBusinessDispute,
  updateBusinessDispute,
  deleteBusinessDispute,
  getDeveloperModuleInstallations,
  getBusinessInstalledModules,
  confirmModuleUpdate,
  submitBusinessVerification,
  getModuleAssignments,
  getModuleAnalysis,
  getBusinessCommissionStats,
  getBusinessPaymentMethods,
  addBusinessPaymentMethod,
  updateBusinessPaymentMethod,
  deleteBusinessPaymentMethod,
  getBusinessFunnel,
  getBusinessEngagement,
  respondToBusinessReview,
  getBusinessLiveStats,
  getPublicFaqs,
} from '../controllers/business';
import { getPublicEvent, registerPublicParticipant } from '../controllers/events';
import {
  createDemand,
  getMyDemands,
  getDemandMatches,
  approveDeveloper,
} from '../controllers/businessDemands';
import { validateBody } from '../middlewares/validators';
import {
  onboardingSchema,
  publicPageSchema,
  businessVerificationSchema,
} from '../validators/business';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { createDisputeSchema, updateDisputeSchema } from '../validators/disputes';

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
router.post('/:slug/reviews', authMiddleware, createBusinessReview);
router.get('/:slug/bookings', getBusinessBookings);
router.get('/:slug/trainings', getBusinessTrainings);
router.get('/:slug/subscriptions', getBusinessSubscriptionPlans);
router.get('/:slug/faqs', getPublicFaqs);
router.get('/:slug/stats/live', getBusinessLiveStats);

// POST /onboarding doit rester ACCESSIBLE aux clients (rôle CLIENT) : c'est LE point d'entrée
// pour créer son premier business (on passe ensuite au rôle BUSINESS dans createBusiness).
// S'il était derrière requireRole(['BUSINESS','ADMIN']), un nouveau vendeur ne pourrait jamais
// soumettre le formulaire → parcours bloqué.
router.post('/onboarding', authMiddleware, validateBody(onboardingSchema), createBusiness);

// Protected routes — require BUSINESS or ADMIN role
router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

router.get('/modules/assignments', getModuleAssignments);
router.get('/modules/analysis', getModuleAnalysis);
router.get('/modules/developer-installations', getDeveloperModuleInstallations);
router.get('/modules/installed', getBusinessInstalledModules);
router.post('/modules/update/:installationId', confirmModuleUpdate);
router.get('/me', getMyBusiness);
router.get('/cockpit', getBossCockpitOverview);
router.get('/cockpit/:businessId', getSingleBusinessCockpit);
router.get('/plan', getMyBusinessPlan);
router.get('/alert-queue', getMyBusinessAlertQueue);
router.get('/clients', getMyBusinessClients);
router.get('/stats', getMyBusinessStats);
router.get('/stats/aggregated', getAggregatedStats);
router.get('/finance/stats', getBusinessCommissionStats);
router.get('/analytics/funnel', getBusinessFunnel);
router.get('/analytics/engagement', getBusinessEngagement);
router.post('/onboarding', validateBody(onboardingSchema), createBusiness);
router.put('/public-page', validateBody(publicPageSchema), updatePublicPage);
router.get('/public-page-preview', getPublicPagePreview);
router.patch('/modules/toggle', toggleBusinessModule);

// Module Demands
router.post('/demands', createDemand);
router.get('/demands', getMyDemands);
router.get('/demands/:id/matches', getDemandMatches);
router.post('/demands/:id/approve/:matchId', approveDeveloper);

// Payment Methods
router.get('/payment-methods', getBusinessPaymentMethods);
router.post('/payment-methods', addBusinessPaymentMethod);
router.put('/payment-methods/:id', updateBusinessPaymentMethod);
router.delete('/payment-methods/:id', deleteBusinessPaymentMethod);

// Documents
router.get('/documents', listBusinessDocuments);
router.get('/documents/:id', getBusinessDocument);
router.post('/documents', createBusinessDocument);
router.put('/documents/:id', updateBusinessDocument);
router.delete('/documents/:id', deleteBusinessDocument);

// Disputes
router.get('/disputes', listBusinessDisputes);
router.get('/disputes/:id', getBusinessDispute);
router.post('/disputes', validateBody(createDisputeSchema), createBusinessDispute);
router.put('/disputes/:id', validateBody(updateDisputeSchema), updateBusinessDispute);
router.delete('/disputes/:id', deleteBusinessDispute);

// Review responses
router.post('/:slug/reviews/:reviewId/respond', respondToBusinessReview);

// Verification / KYC
router.post('/verification', validateBody(businessVerificationSchema), submitBusinessVerification);

export default router;

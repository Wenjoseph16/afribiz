import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  createPlanSchema,
  updatePlanSchema,
  createSubscriptionSchema,
  cancelSubscriptionSchema,
  recordPaymentSchema,
} from '../validators/subscriptions';
import {
  listSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  listSubscribers,
  getSubscriber,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  listSubscriptionPayments,
  recordSubscriptionPayment,
  listSubscriptionLogs,
  getSubscriptionStats,
  getMySubscription,
  subscribeToPlan,
  cancelMySubscription,
} from '../controllers/subscriptions';

const router = Router();
router.use(authMiddleware);

const businessGuard = requireRole(['BUSINESS', 'ADMIN']);
const anyGuard = requireRole(['BUSINESS', 'CLIENT', 'DEVELOPER', 'ADMIN']);

router.get('/stats', businessGuard, getSubscriptionStats);

router.get('/plans', listSubscriptionPlans);
router.post('/plans', businessGuard, validateBody(createPlanSchema), createSubscriptionPlan);
router.patch('/plans/:id', businessGuard, validateBody(updatePlanSchema), updateSubscriptionPlan);
router.delete('/plans/:id', businessGuard, deleteSubscriptionPlan);
router.get('/plans/:id', listSubscriptionPlans);

router.get('/subscribers', businessGuard, listSubscribers);
router.post(
  '/subscribers',
  businessGuard,
  validateBody(createSubscriptionSchema),
  createSubscription
);
router.get('/subscribers/:id', businessGuard, getSubscriber);
router.patch(
  '/subscribers/:id/cancel',
  businessGuard,
  validateBody(cancelSubscriptionSchema),
  cancelSubscription
);
router.post('/subscribers/:id/renew', businessGuard, renewSubscription);

router.get('/payments', businessGuard, listSubscriptionPayments);
router.post(
  '/payments',
  businessGuard,
  validateBody(recordPaymentSchema),
  recordSubscriptionPayment
);

router.get('/logs', businessGuard, listSubscriptionLogs);

// User-facing subscription endpoints
router.get('/my-subscription', anyGuard, getMySubscription);
router.post('/subscribe', anyGuard, validateBody(createSubscriptionSchema), subscribeToPlan);
router.post('/my-subscription/cancel', anyGuard, cancelMySubscription);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  createPlanSchema, updatePlanSchema,
  createSubscriptionSchema, cancelSubscriptionSchema,
  recordPaymentSchema,
} from '../validators/subscriptions';
import {
  listSubscriptionPlans, getSubscriptionPlan, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan,
  listSubscribers, getSubscriber, createSubscription, cancelSubscription, renewSubscription,
  listSubscriptionPayments, recordSubscriptionPayment,
  listSubscriptionLogs, getSubscriptionStats,
  getMySubscription, subscribeToPlan, cancelMySubscription,
} from '../controllers/subscriptions';

const router = Router();
router.use(authMiddleware);

router.get('/stats', getSubscriptionStats);

router.get('/plans', listSubscriptionPlans);
router.post('/plans', validateBody(createPlanSchema), createSubscriptionPlan);
router.patch('/plans/:id', validateBody(updatePlanSchema), updateSubscriptionPlan);
router.delete('/plans/:id', deleteSubscriptionPlan);
router.get('/plans/:id', getSubscriptionPlan);

router.get('/subscribers', listSubscribers);
router.post('/subscribers', validateBody(createSubscriptionSchema), createSubscription);
router.get('/subscribers/:id', getSubscriber);
router.patch('/subscribers/:id/cancel', validateBody(cancelSubscriptionSchema), cancelSubscription);
router.post('/subscribers/:id/renew', renewSubscription);

router.get('/payments', listSubscriptionPayments);
router.post('/payments', validateBody(recordPaymentSchema), recordSubscriptionPayment);

router.get('/logs', listSubscriptionLogs);

// User-facing subscription endpoints
router.get('/my-subscription', getMySubscription);
router.post('/subscribe', validateBody(createSubscriptionSchema), subscribeToPlan);
router.post('/my-subscription/cancel', cancelMySubscription);

export default router;

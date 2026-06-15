import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getCustomer360,
  trackPageView,
  trackProductView,
  trackProductClick,
} from '../controllers/customer360';

const router = Router();

router.use(authMiddleware);

// Tracking endpoints
router.post('/track/page-view', trackPageView);
router.post('/track/product-view', trackProductView);
router.post('/track/product-click', trackProductClick);

// Customer 360° aggregation endpoint
router.get('/clients/:clientId/360', getCustomer360);

export default router;

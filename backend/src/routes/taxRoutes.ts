import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/taxController';

const router = Router();

// Public routes
router.get('/countries', ctrl.listCountryTaxes);
router.get('/countries/:countryCode', ctrl.getCountryTax);

// Protected routes
router.post('/countries', authMiddleware, requireRole(['ADMIN']), ctrl.createCountryTax);
router.put(
  '/countries/:countryCode',
  authMiddleware,
  requireRole(['ADMIN']),
  ctrl.updateCountryTax
);

// Business-specific (auth required)
router.get(
  '/business/config',
  authMiddleware,
  requireRole(['BUSINESS', 'ADMIN']),
  ctrl.getBusinessConfig
);
router.put(
  '/business/config',
  authMiddleware,
  requireRole(['BUSINESS', 'ADMIN']),
  ctrl.updateBusinessConfig
);
router.get(
  '/business/reports',
  authMiddleware,
  requireRole(['BUSINESS', 'ADMIN']),
  ctrl.listReports
);
router.post(
  '/business/reports',
  authMiddleware,
  requireRole(['BUSINESS', 'ADMIN']),
  ctrl.generateReport
);

export default router;

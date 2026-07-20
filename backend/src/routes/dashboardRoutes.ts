import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import {
  getClientDashboard,
  getBusinessDashboard,
  getDeveloperDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController';

const router = Router();

router.get(
  '/client',
  authMiddleware,
  cacheResponse({ prefix: 'dashboard-client', ttl: 60_000 }),
  getClientDashboard
);
router.get(
  '/business',
  authMiddleware,
  requireRole(['BUSINESS', 'ADMIN']),
  cacheResponse({ prefix: 'dashboard-business', ttl: 60_000 }),
  getBusinessDashboard
);
router.get(
  '/developer',
  authMiddleware,
  requireRole(['DEVELOPER', 'ADMIN']),
  cacheResponse({ prefix: 'dashboard-developer', ttl: 60_000 }),
  getDeveloperDashboard
);
router.get(
  '/admin',
  authMiddleware,
  requireRole(['ADMIN']),
  cacheResponse({ prefix: 'dashboard-admin', ttl: 120_000 }),
  getAdminDashboard
);

export default router;

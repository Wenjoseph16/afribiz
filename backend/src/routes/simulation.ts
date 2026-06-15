import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  getSimulationEnvironments,
  testEndpoint,
  getSimulationLogs,
  getMockData,
  getAvailableEndpoints,
} from '../controllers/simulation';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['DEVELOPER', 'ADMIN']));

router.get('/environments', getSimulationEnvironments);
router.post('/environments/:moduleSlug/test', testEndpoint);
router.get('/environments/:moduleSlug/mock/:dataType', getMockData);
router.get('/logs', getSimulationLogs);
router.get('/endpoints', getAvailableEndpoints);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getMyClientIntelligence,
  getClientSegments,
  getTopClients,
  getActivityBarometer,
} from '../controllers/clientIntelligenceController';

const router = Router();

router.use(authMiddleware);

router.get('/my', getMyClientIntelligence);
router.get('/segments', getClientSegments);
router.get('/top-clients', getTopClients);
router.get('/barometer', getActivityBarometer);

export default router;

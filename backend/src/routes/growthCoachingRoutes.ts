import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getGrowthDetection,
  getCoachDashboard,
  getModuleRecommendations,
} from '../controllers/growthCoachingController';

const router = Router();

router.use(authMiddleware);

router.get('/growth-detection', getGrowthDetection);
router.get('/coach', getCoachDashboard);
router.get('/module-advisor', getModuleRecommendations);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getDevMatches,
  getBusinessMatches,
  getBizForDevMatches,
  getSuggestedMatches,
} from '../controllers/matchingController';

const router = Router();

router.use(authMiddleware);

router.get('/', getSuggestedMatches);
router.get('/dev-matches', getDevMatches);
router.get('/business-matches', getBusinessMatches);
router.get('/biz-for-dev', getBizForDevMatches);

export default router;

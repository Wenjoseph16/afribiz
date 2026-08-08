import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { submitSurveySchema } from '../validators/satisfaction';
import * as satisfactionController from '../controllers/satisfactionController';

const router = Router();
router.use(authMiddleware);

router.post('/', validateBody(submitSurveySchema), satisfactionController.submitSurvey);
router.get('/context', satisfactionController.getContext);
router.get('/stats', satisfactionController.getBusinessStats);
router.get('/reputation', satisfactionController.getBusinessReputation);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getMyTrainings, enrollInTraining } from '../controllers/training';

const router = Router();

router.use(authMiddleware);

router.get('/my', getMyTrainings);
router.post('/:id/enroll', enrollInTraining);

export default router;

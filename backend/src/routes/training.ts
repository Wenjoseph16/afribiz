import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listAllTrainings,
  getMyTrainings,
  enrollInTraining,
  generateCertificateCtrl,
} from '../controllers/training';

const router = Router();

router.use(authMiddleware);

router.get('/', listAllTrainings);
router.get('/my', getMyTrainings);
router.post('/:id/enroll', enrollInTraining);
router.post('/:trainingId/certificate', generateCertificateCtrl);

export default router;

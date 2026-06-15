import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { clientRegisterForEvent } from '../controllers/events';

const router = Router();
router.use(authMiddleware);

router.post('/:id/register', clientRegisterForEvent);

export default router;
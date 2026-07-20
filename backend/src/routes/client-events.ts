import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { clientRegisterForEvent, getMyTicket } from '../controllers/events';

const router = Router();
router.use(authMiddleware);

router.post('/:id/register', clientRegisterForEvent);
router.get('/my-ticket/:eventId', getMyTicket);

export default router;

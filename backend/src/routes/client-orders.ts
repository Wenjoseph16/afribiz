import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { updateMyOrderSchema } from '../validators/client';
import { getMyOrders, getMyOrder, updateMyOrder, cancelMyOrder, getMyOrderTimeline } from '../controllers/orders';

const router = Router();
router.use(authMiddleware);

router.get('/', getMyOrders);
router.get('/:id', getMyOrder);
router.get('/:id/timeline', getMyOrderTimeline);
router.put('/:id', validateBody(updateMyOrderSchema), updateMyOrder);
router.post('/:id/cancel', cancelMyOrder);

export default router;

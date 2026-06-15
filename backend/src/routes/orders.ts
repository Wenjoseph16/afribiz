import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listBusinessOrders, getBusinessOrder, createBusinessOrder,
  updateBusinessOrderStatus, updateBusinessDeliveryStatus,
  updateBusinessOrderPayment, deleteBusinessOrder, getBusinessOrderStats,
  listBusinessDebts, payBusinessDebt, settleBusinessDebt,
} from '../controllers/orders';
import {
  createOrderSchema, updateStatusSchema, updateDeliverySchema, updatePaymentSchema, payDebtSchema,
} from '../validators/orders';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Orders
router.get('/stats', getBusinessOrderStats);
router.get('/', listBusinessOrders);
router.post('/', validateBody(createOrderSchema), createBusinessOrder);
router.get('/:id', getBusinessOrder);
router.put('/:id/status', validateBody(updateStatusSchema), updateBusinessOrderStatus);
router.put('/:id/delivery', validateBody(updateDeliverySchema), updateBusinessDeliveryStatus);
router.put('/:id/payment', validateBody(updatePaymentSchema), updateBusinessOrderPayment);
router.delete('/:id', deleteBusinessOrder);

// Debts
router.get('/debts/list', listBusinessDebts);
router.post('/debts/:id/pay', validateBody(payDebtSchema), payBusinessDebt);
router.post('/debts/:id/settle', settleBusinessDebt);

export default router;

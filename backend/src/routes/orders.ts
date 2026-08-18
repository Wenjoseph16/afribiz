import { Router } from 'express';
import { authMiddleware, requireEmployeePermission } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listBusinessOrders,
  getBusinessOrder,
  createBusinessOrder,
  updateBusinessOrderStatus,
  updateBusinessDeliveryStatus,
  updateBusinessOrderPayment,
  deleteBusinessOrder,
  getBusinessOrderStats,
  listBusinessDebts,
  payBusinessDebt,
  settleBusinessDebt,
  exportOrdersCSV,
  exportOrderInvoicePDF,
} from '../controllers/orders';
import {
  createOrderSchema,
  updateStatusSchema,
  updateDeliverySchema,
  updatePaymentSchema,
  payDebtSchema,
} from '../validators/orders';

const router = Router();

router.use(authMiddleware);

// ── Lecture (VIEW_ORDERS) ──
router.get('/stats', requireEmployeePermission(['VIEW_ORDERS', 'VIEW_STATS']), getBusinessOrderStats);
router.get('/', requireEmployeePermission(['VIEW_ORDERS']), listBusinessOrders);
router.get('/:id', requireEmployeePermission(['VIEW_ORDERS']), getBusinessOrder);

// ── Écriture (MODIFY_STOCK) ──
router.post('/', requireEmployeePermission(['VIEW_ORDERS']), validateBody(createOrderSchema), createBusinessOrder);
router.put('/:id/status', requireEmployeePermission(['MODIFY_STOCK']), validateBody(updateStatusSchema), updateBusinessOrderStatus);
router.put('/:id/delivery', requireEmployeePermission(['MODIFY_STOCK']), validateBody(updateDeliverySchema), updateBusinessDeliveryStatus);

// ── Finance (ACCESS_FINANCES) ──
router.put('/:id/payment', requireEmployeePermission(['ACCESS_FINANCES']), validateBody(updatePaymentSchema), updateBusinessOrderPayment);

// ── Suppression (MODIFY_STOCK) ──
router.delete('/:id', requireEmployeePermission(['MODIFY_STOCK']), deleteBusinessOrder);

// ── Export (VIEW_ORDERS) ──
router.get('/export/csv', requireEmployeePermission(['VIEW_ORDERS']), exportOrdersCSV);
router.get('/export/invoice/:id', requireEmployeePermission(['VIEW_ORDERS']), exportOrderInvoicePDF);

// ── Dettes (ACCESS_FINANCES) ──
router.get('/debts/list', requireEmployeePermission(['ACCESS_FINANCES']), listBusinessDebts);
router.post('/debts/:id/pay', requireEmployeePermission(['ACCESS_FINANCES']), validateBody(payDebtSchema), payBusinessDebt);
router.post('/debts/:id/settle', requireEmployeePermission(['ACCESS_FINANCES']), settleBusinessDebt);

export default router;

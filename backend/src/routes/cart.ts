import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
  checkoutSchema,
} from '../validators/cart';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  checkout,
  guestCheckoutCtrl,
} from '../controllers/cart';

const router = Router();

router.get('/', optionalAuth, getCart);
router.post('/items', authMiddleware, validateBody(addToCartSchema), addItem);
router.put('/items/:itemId', authMiddleware, validateBody(updateCartItemSchema), updateItem);
router.delete('/items/:itemId', authMiddleware, removeItem);
router.delete('/', authMiddleware, clearCart);
router.post('/coupon', authMiddleware, validateBody(applyCouponSchema), applyCoupon);
router.delete('/coupon', authMiddleware, removeCoupon);
router.post('/guest-checkout', guestCheckoutCtrl);
router.post('/checkout', authMiddleware, validateBody(checkoutSchema), checkout);

export default router;

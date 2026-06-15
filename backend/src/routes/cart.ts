import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { addToCartSchema, updateCartItemSchema, applyCouponSchema, checkoutSchema } from '../validators/cart';
import { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, checkout } from '../controllers/cart';

const router = Router();
router.use(authMiddleware);

router.get('/', getCart);
router.post('/items', validateBody(addToCartSchema), addItem);
router.put('/items/:itemId', validateBody(updateCartItemSchema), updateItem);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);
router.post('/coupon', validateBody(applyCouponSchema), applyCoupon);
router.delete('/coupon', removeCoupon);
router.post('/checkout', validateBody(checkoutSchema), checkout);

export default router;

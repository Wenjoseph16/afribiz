import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { uploadMultiple } from '../middlewares/upload';
import { getReviews, createReview, updateReview, deleteReview } from '../controllers/reviews';

const router = Router();

router.use(authMiddleware);

router.get('/', getReviews);
router.post('/', uploadMultiple, createReview);
router.put('/:id', uploadMultiple, updateReview);
router.patch('/:id', uploadMultiple, updateReview);
router.delete('/:id', deleteReview);

export default router;

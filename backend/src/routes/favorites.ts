import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favorites';

const router = Router();

router.use(authMiddleware);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:id', removeFavorite);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { addReaction, removeReaction, getMessageReactions } from '../controllers/reactions';

const router = Router();

// Auth appliqué par route (et non router.use global) : ce routeur est monté
// nu sous /api — un router.use(authMiddleware) ici bloquerait TOUTES les routes
// publiques non couvertes en amont (ex: /api/home, /api/plans).
router.get('/messages/:messageId/reactions', authMiddleware, getMessageReactions);
router.post('/messages/:messageId/reactions', authMiddleware, addReaction);
router.delete('/messages/:messageId/reactions/:emoji', authMiddleware, removeReaction);

export default router;

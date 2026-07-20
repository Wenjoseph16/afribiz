import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { addReaction, removeReaction, getMessageReactions } from '../controllers/reactions';

const router = Router();

router.use(authMiddleware);

router.get('/messages/:messageId/reactions', getMessageReactions);
router.post('/messages/:messageId/reactions', addReaction);
router.delete('/messages/:messageId/reactions/:emoji', removeReaction);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createNeed,
  getNeeds,
  getNeedById,
  voteNeed,
  unvoteNeed,
  closeNeed,
} from '../controllers/marketNeedController';

const router = Router();

router.get('/', getNeeds);
router.get('/:id', getNeedById);
router.use(authMiddleware);
router.post('/', createNeed);
router.post('/:id/vote', voteNeed);
router.delete('/:id/vote', unvoteNeed);
router.patch('/:id/close', closeNeed);

export default router;

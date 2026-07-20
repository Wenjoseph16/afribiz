import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getFollowCount,
  checkFollowing,
} from '../controllers/followController';

const router = Router();

router.post('/', authMiddleware, follow);
router.delete('/:id', authMiddleware, unfollow);
router.get('/following', authMiddleware, getFollowing);
router.get('/check', authMiddleware, checkFollowing);
router.get('/:targetId/:type/count', getFollowCount);
router.get('/:targetId/:type', authMiddleware, getFollowers);

export default router;

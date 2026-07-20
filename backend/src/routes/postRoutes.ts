import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createPost,
  updatePost,
  deletePost,
  getPost,
  listPosts,
  toggleLike,
  getFeed,
} from '../controllers/postController';

const router = Router();

router.get('/feed', getFeed);
router.get('/', listPosts);
router.get('/:id', getPost);
router.post('/', authMiddleware, createPost);
router.put('/:id', authMiddleware, updatePost);
router.patch('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, toggleLike);

export default router;

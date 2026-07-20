import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
} from '../controllers/commentController';

const router = Router();

router.get('/:type/:referenceId', getComments);
router.get('/detail/:id', getCommentById);

router.use(authMiddleware);
router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;

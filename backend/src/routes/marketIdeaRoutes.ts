import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createIdea,
  getIdeas,
  getIdeaById,
  voteIdea,
  unvoteIdea,
  getTopIdeas,
} from '../controllers/marketIdeaController';

const router = Router();

router.get('/', getIdeas);
router.get('/top', getTopIdeas);
router.get('/:id', getIdeaById);
router.use(authMiddleware);
router.post('/', createIdea);
router.post('/:id/vote', voteIdea);
router.delete('/:id/vote', unvoteIdea);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { searchAll } from '../controllers/search';

const router = Router();

router.get('/all', authMiddleware, searchAll);

export default router;

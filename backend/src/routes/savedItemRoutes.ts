import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  saveItem,
  unsaveItem,
  listSavedItems,
  checkSaved,
  getSavedCount,
} from '../controllers/savedItemController';

const router = Router();

router.get('/', authMiddleware, listSavedItems);
router.post('/', authMiddleware, saveItem);
router.get('/check', authMiddleware, checkSaved);
router.get('/count', getSavedCount);
router.delete('/:id', authMiddleware, unsaveItem);

export default router;

import { Router } from 'express';
import { authMiddleware, optionalAuth, requireRole } from '../middlewares/auth';
import {
  getShorts, getShortById, createShort, updateShort, deleteShort,
  likeShort, addComment, getComments, viewShort, shareShort, saveShort,
} from '../controllers/shortController';

const router = Router();

// Routes publiques
router.get('/shorts', getShorts);
router.get('/shorts/:id', optionalAuth, getShortById);
router.get('/shorts/:id/comments', getComments);
router.post('/shorts/:id/view', viewShort);
router.post('/shorts/:id/share', shareShort);
router.post('/shorts/:id/comments', optionalAuth, addComment);

// Routes authentifiées (BUSINESS, DEVELOPER ou ADMIN uniquement)
router.post('/shorts', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), createShort);
router.put('/shorts/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), updateShort);
router.delete('/shorts/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), deleteShort);
router.post('/shorts/:id/like', authMiddleware, likeShort);
router.post('/shorts/:id/save', authMiddleware, saveShort);

export default router;

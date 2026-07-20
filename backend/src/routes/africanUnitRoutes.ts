import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/africanUnitController';

const router = Router();

// Public routes — conversion tool accessible without auth
router.get('/', ctrl.list);
router.get('/categories', ctrl.categories);
router.get('/:id', ctrl.get);
router.post('/convert', ctrl.convert);

// Protected routes
router.post('/', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.create);
router.put('/:id', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.update);
router.delete('/:id', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.remove);

export default router;

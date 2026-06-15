import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { uploadSingle, uploadMultiple } from '../middlewares/upload';
import { uploadMedia, uploadMultipleMedia } from '../controllers/uploadController';

const router = Router();

router.post('/upload/media', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), uploadSingle, uploadMedia);
router.post('/upload/media/multiple', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), uploadMultiple, uploadMultipleMedia);

export default router;

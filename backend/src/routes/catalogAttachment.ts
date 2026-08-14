import { Router } from 'express';
import {
  createAttachment,
  listAttachments,
  updateAttachment,
  removeAttachment,
} from '../controllers/catalogAttachmentController';
import { validateBody } from '../middlewares/validators';
import {
  createCatalogAttachmentSchema,
  updateCatalogAttachmentSchema,
} from '../validators/catalogAttachment';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/', listAttachments);
router.post('/', validateBody(createCatalogAttachmentSchema), createAttachment);
router.patch('/:id', validateBody(updateCatalogAttachmentSchema), updateAttachment);
router.delete('/:id', removeAttachment);

export default router;

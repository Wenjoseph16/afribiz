import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  getTemplates,
  upsertTemplate,
  deleteTemplate,
  toggleTemplate,
  getAvailableTypes,
} from '../controllers/notificationTemplate';

const router = Router();

router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

router.get('/', getTemplates);
router.get('/available-types', getAvailableTypes);
router.post('/business/:businessId', upsertTemplate);
router.patch('/business/:businessId/toggle', toggleTemplate);
router.delete('/business/:businessId', deleteTemplate);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getTemplates,
  upsertTemplate,
  deleteTemplate,
  toggleTemplate,
  getAvailableTypes,
} from '../controllers/notificationTemplate';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.get('/available-types', getAvailableTypes);
router.post('/business/:businessId', upsertTemplate);
router.patch('/business/:businessId/toggle', toggleTemplate);
router.delete('/business/:businessId', deleteTemplate);

export default router;

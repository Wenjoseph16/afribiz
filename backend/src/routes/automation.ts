import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getExecutionLogs,
} from '../controllers/automationController';

const router = Router();

router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

router.get('/', listRules);
router.get('/logs', getExecutionLogs);
router.get('/:ruleId', getRule);
router.post('/', createRule);
router.put('/:ruleId', updateRule);
router.patch('/:ruleId/toggle', toggleRule);
router.delete('/:ruleId', deleteRule);

export default router;

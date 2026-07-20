import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/whatsappController';

const router = Router();
router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

router.get('/templates', ctrl.listTemplates);
router.post('/templates', ctrl.createTemplate);
router.put('/templates/:id', ctrl.updateTemplate);
router.delete('/templates/:id', ctrl.deleteTemplate);
router.get('/sessions', ctrl.listSessions);
router.get('/sessions/:sessionId/messages', ctrl.getSessionMessages);
router.post('/messages', ctrl.sendMessage);
router.get('/stats', ctrl.stats);

export default router;

import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as disputeController from '../controllers/disputes';

const router = Router();

// Toutes les routes de litiges nécessitent l'authentification
router.use(authMiddleware);

// Seuls les BUSINESS et ADMIN peuvent gérer les litiges
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/', disputeController.listDisputes);
router.get('/:id', disputeController.getDispute);
router.post('/', disputeController.createDispute);
router.patch('/:id', disputeController.updateDispute);
router.delete('/:id', disputeController.deleteDispute);

// Evidence (preuves)
router.post('/:id/evidence', disputeController.addEvidence);
router.get('/:id/evidence', disputeController.getEvidence);
router.delete('/:id/evidence', disputeController.deleteEvidence);

// Comments (messages)
router.get('/:id/comments', disputeController.getComments);
router.post('/:id/comments', disputeController.addComment);

export default router;

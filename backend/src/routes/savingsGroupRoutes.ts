import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/savingsGroupController';

const router = Router();
router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

// Groupes
router.get('/', ctrl.list);
router.get('/stats', ctrl.stats);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Membres
router.post('/:id/members', ctrl.addMember);
router.delete('/members/:memberId', ctrl.removeMember);
router.get('/members/:memberId/score', ctrl.getMemberScore);

// Cycles
router.post('/:id/cycles', ctrl.startCycle);
router.put('/cycles/:cycleId/close', ctrl.closeCycle);
router.post('/cycles/:cycleId/validate', ctrl.validateCycle);
router.post('/cycles/:cycleId/payout', ctrl.processPayouts);
router.get('/cycles/:cycleId/status', ctrl.getCycleStatus);

// Cotisations
router.post('/contributions', ctrl.recordContribution);

// Prêts
router.get('/loans/list', ctrl.listLoans);
router.post('/loans', ctrl.createLoan);
router.put('/loans/:loanId/approve', ctrl.approveLoan);
router.post('/loans/:loanId/repay', ctrl.repayLoan);

// Escrows
router.get('/:id/escrows', ctrl.getGroupEscrows);

export default router;

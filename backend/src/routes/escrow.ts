import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  createEscrow,
  listEscrows,
  getEscrowById,
  releaseEscrow,
  refundEscrow,
  disputeEscrow,
  getEscrowStats,
  listClientEscrows,
  getClientEscrowById,
  confirmClientEscrow,
  clientDisputeEscrow,
} from '../controllers/escrow';
import {
  createEscrowSchema,
  refundEscrowSchema,
  disputeEscrowSchema,
} from '../validators/debtsPayments';
import { z } from 'zod';

// Business escrow router
const businessRouter = Router();
businessRouter.use(authMiddleware);
const businessGuard = requireRole(['BUSINESS', 'ADMIN']);

businessRouter.post('/', businessGuard, validateBody(createEscrowSchema), createEscrow);
businessRouter.get('/', businessGuard, listEscrows);
businessRouter.get('/stats', businessGuard, getEscrowStats);
businessRouter.get('/:id', businessGuard, getEscrowById);
businessRouter.post('/:id/release', businessGuard, releaseEscrow);
businessRouter.post('/:id/refund', businessGuard, validateBody(refundEscrowSchema), refundEscrow);
businessRouter.post(
  '/:id/dispute',
  businessGuard,
  validateBody(disputeEscrowSchema),
  disputeEscrow
);

// Client escrow router
const clientRouter = Router();
clientRouter.use(authMiddleware);
const clientGuard = requireRole(['CLIENT', 'ADMIN']);

clientRouter.get('/', clientGuard, listClientEscrows);
clientRouter.get('/:id', clientGuard, getClientEscrowById);
clientRouter.post('/:id/confirm', clientGuard, confirmClientEscrow);
clientRouter.post(
  '/:id/dispute',
  clientGuard,
  validateBody(z.object({ reason: z.string().min(1) })),
  clientDisputeEscrow
);

export { businessRouter, clientRouter };

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as debtsPaymentsService from '../services/debtsPayments';

// ===================== BUSINESS =====================

export const createEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const escrow = await debtsPaymentsService.createEscrow(req.user!.id, req.body);
  res.status(201).json({ success: true, data: escrow, message: 'Escrow créé' });
});

export const listEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const result = await debtsPaymentsService.listEscrows(req.user!.id, req.query);
  res.json({ success: true, data: result });
});

export const getEscrowById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const escrow = await debtsPaymentsService.getEscrowById(req.user!.id, req.params.id);
  res.json({ success: true, data: escrow });
});

export const releaseEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const escrow = await debtsPaymentsService.releaseEscrow(req.user!.id, req.params.id);
  res.json({ success: true, data: escrow, message: 'Escrow libéré' });
});

export const refundEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const escrow = await debtsPaymentsService.refundEscrow(
    req.user!.id,
    req.params.id,
    req.body.reason
  );
  res.json({ success: true, data: escrow, message: 'Escrow remboursé' });
});

export const disputeEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const escrow = await debtsPaymentsService.disputeEscrow(
    req.user!.id,
    req.params.id,
    req.body.reason
  );
  res.json({ success: true, data: escrow, message: 'Litige escrow ouvert' });
});

export const getEscrowStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await debtsPaymentsService.getPaymentStats(req.user!.id);
  res.json({ success: true, data: stats });
});

// ===================== CLIENT =====================

export const listClientEscrows = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await debtsPaymentsService.listClientEscrows(req.user!.id, req.query);
    res.json({ success: true, data: result });
  }
);

export const getClientEscrowById = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const escrow = await debtsPaymentsService.getClientEscrowById(req.user!.id, req.params.id);
    res.json({ success: true, data: escrow });
  }
);

export const confirmClientEscrow = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const escrow = await debtsPaymentsService.clientReleaseEscrow(req.user!.id, req.params.id);
    res.json({ success: true, data: escrow, message: 'Paiement confirmé — fonds libérés' });
  }
);

export const clientDisputeEscrow = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const escrow = await debtsPaymentsService.clientDisputeEscrow(
      req.user!.id,
      req.params.id,
      req.body.reason
    );
    res.json({ success: true, data: escrow, message: 'Litige ouvert' });
  }
);

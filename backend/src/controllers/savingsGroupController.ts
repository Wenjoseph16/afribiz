import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as savingsService from '../services/savingsGroupService';

const requireAuth = (req: AuthenticatedRequest) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  return req.user.id;
};

export const list = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.listSavingsGroups(userId);
  res.json({ success: true, data });
});

export const get = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.getSavingsGroup(userId, req.params.id);
  res.json({ success: true, data });
});

export const create = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.createSavingsGroup(userId, req.body);
  res.status(201).json({ success: true, data });
});

export const update = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.updateSavingsGroup(userId, req.params.id, req.body);
  res.json({ success: true, data });
});

export const remove = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  await savingsService.deleteSavingsGroup(userId, req.params.id);
  res.json({ success: true, message: 'Groupe supprimé' });
});

export const addMember = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.addSavingsMember(userId, req.body);
  res.status(201).json({ success: true, data });
});

export const removeMember = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  await savingsService.removeSavingsMember(userId, req.params.memberId);
  res.json({ success: true, message: 'Membre retiré' });
});

export const getMemberScore = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.getMemberScore(userId, req.params.memberId);
  res.json({ success: true, data });
});

export const startCycle = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.startSavingsCycle(userId, req.params.id, req.body.startDate);
  res.status(201).json({ success: true, data });
});

export const closeCycle = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.closeSavingsCycle(userId, req.params.cycleId);
  res.json({ success: true, data });
});

export const validateCycle = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.validateCycleClosure(userId, req.params.cycleId);
  res.json({ success: true, data });
});

export const processPayouts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.processCyclePayouts(userId, req.params.cycleId);
  res.json({ success: true, data });
});

export const getCycleStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.getCyclePayoutStatus(userId, req.params.cycleId);
  res.json({ success: true, data });
});

export const recordContribution = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireAuth(req);
    const data = await savingsService.recordContribution(userId, req.body);
    res.status(201).json({ success: true, data });
  }
);

export const listLoans = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.listLoans(userId, req.query.groupId as string);
  res.json({ success: true, data });
});

export const createLoan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.createLoan(userId, req.body);
  res.status(201).json({ success: true, data });
});

export const approveLoan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.approveLoan(userId, req.params.loanId);
  res.json({ success: true, data });
});

export const repayLoan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.repayLoan(
    userId,
    req.params.loanId,
    req.body.amount,
    req.body.method
  );
  res.json({ success: true, data });
});

export const stats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireAuth(req);
  const data = await savingsService.getSavingsStats(userId);
  res.json({ success: true, data });
});

export const getGroupEscrows = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireAuth(req);
    const data = await savingsService.getGroupEscrows(userId, req.params.id);
    res.json({ success: true, data });
  }
);

import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as automationEngine from '../services/automationEngine';

async function getBusinessId(req: AuthenticatedRequest) {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const business = await prisma.business.findFirst({
    where: { ownerId: req.user.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

export const getExecutionLogs = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const logs = await prisma.automationRule.findMany({
      where: { businessId, executionCount: { gt: 0 } },
      select: {
        id: true,
        name: true,
        executionCount: true,
        lastExecutedAt: true,
        status: true,
      },
      orderBy: { lastExecutedAt: 'desc' },
      take: 50,
    });
    const formattedLogs = logs
      .filter((l) => l.lastExecutedAt)
      .map((l) => ({
        id: l.id,
        ruleName: l.name,
        ruleId: l.id,
        status: l.status,
        createdAt: l.lastExecutedAt,
        executionCount: l.executionCount,
      }));
    res.json({ success: true, data: formattedLogs });
  }
);

export const listRules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const rules = await automationEngine.listRules(businessId);
  res.json({ success: true, data: rules });
});

export const getRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const rule = await automationEngine.getRule(businessId, req.params.ruleId);
  res.json({ success: true, data: rule });
});

export const createRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const rule = await automationEngine.createRule(businessId, {
    name: req.body.name,
    description: req.body.description,
    trigger: req.body.trigger,
    conditions: req.body.conditions,
    actionType: req.body.actionType,
    actionConfig: req.body.actionConfig,
  });
  res.status(201).json({ success: true, data: rule });
});

export const updateRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const rule = await automationEngine.updateRule(businessId, req.params.ruleId, {
    name: req.body.name,
    description: req.body.description,
    trigger: req.body.trigger,
    conditions: req.body.conditions,
    actionType: req.body.actionType,
    actionConfig: req.body.actionConfig,
  });
  res.json({ success: true, data: rule });
});

export const deleteRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await automationEngine.deleteRule(businessId, req.params.ruleId);
  res.json({ success: true, data: null });
});

export const toggleRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const rule = await automationEngine.toggleRule(businessId, req.params.ruleId);
  res.json({ success: true, data: rule });
});

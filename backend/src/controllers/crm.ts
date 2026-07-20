import type { Response } from 'express';
import { prisma } from '../lib/db';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as crmService from '../services/crm';

async function getBusinessId(req: AuthenticatedRequest) {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const business = await prisma.business.findUnique({
    where: { ownerId: req.user.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

export const getCrmDashboardStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const stats = await crmService.getCrmDashboardStats(businessId);
    res.json({ success: true, data: stats });
  }
);

export const listClients = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const { search, tagId, segmentId, isActive, sortBy, sortOrder, limit, offset } = req.query;
  const result = await crmService.getBusinessClients(businessId, {
    search: search as string,
    tagId: tagId as string,
    segmentId: segmentId as string,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    limit: Math.min(Number(limit) || 50, 100),
    offset: Number(offset) || 0,
  });
  res.json({ success: true, data: result });
});

export const getClientDetail = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const detail = await crmService.getClientDetail(businessId, req.params.clientId);
    res.json({ success: true, data: detail });
  }
);

export const createNote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const note = await crmService.addClientNote(
    businessId,
    req.params.clientId,
    req.body.content,
    req.user?.id
  );
  res.status(201).json({ success: true, data: note });
});

export const updateNote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const note = await crmService.updateClientNote(businessId, req.params.noteId, req.body.content);
  res.json({ success: true, data: note });
});

export const deleteNote = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.deleteClientNote(businessId, req.params.noteId);
  res.json({ success: true, data: null });
});

export const listTags = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const tags = await crmService.getTags(businessId);
  res.json({ success: true, data: tags });
});

export const createTag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const tag = await crmService.createTag(businessId, req.body.name, req.body.color);
  res.status(201).json({ success: true, data: tag });
});

export const deleteTag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.deleteTag(businessId, req.params.tagId);
  res.json({ success: true, data: null });
});

export const assignTag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.assignTag(businessId, req.params.clientId, req.body.tagId);
  res.json({ success: true, data: null });
});

export const removeTag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.removeTag(businessId, req.params.clientId, req.params.tagId);
  res.json({ success: true, data: null });
});

export const listSegments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const segments = await crmService.getSegments(businessId);
  res.json({ success: true, data: segments });
});

export const createSegment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const segment = await crmService.createSegment(businessId, {
    name: req.body.name,
    description: req.body.description,
    color: req.body.color,
    conditions: req.body.conditions,
    isDynamic: req.body.isDynamic,
  });
  res.status(201).json({ success: true, data: segment });
});

export const updateSegment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const segment = await crmService.updateSegment(businessId, req.params.segmentId, req.body);
  res.json({ success: true, data: segment });
});

export const deleteSegment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.deleteSegment(businessId, req.params.segmentId);
  res.json({ success: true, data: null });
});

export const assignClientToSegment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    await crmService.assignClientToSegment(businessId, req.params.clientId, req.body.segmentId);
    res.json({ success: true, data: null });
  }
);

export const removeClientFromSegment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    await crmService.removeClientFromSegment(businessId, req.params.clientId, req.params.segmentId);
    res.json({ success: true, data: null });
  }
);

export const recalculateSegment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const result = await crmService.recalculateSegment(businessId, req.params.segmentId);
    res.json({ success: true, data: result });
  }
);

export const syncClientVisit = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const bc = await crmService.syncClientVisit(businessId, req.params.clientId);
    res.json({ success: true, data: bc });
  }
);

// ===== Pipeline =====
export const listStages = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const stages = await crmService.listStages(businessId);
  res.json({ success: true, data: stages });
});

export const createStage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const stage = await crmService.createStage(businessId, req.body);
  res.status(201).json({ success: true, data: stage });
});

export const updateStage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const stage = await crmService.updateStage(businessId, req.params.stageId, req.body);
  res.json({ success: true, data: stage });
});

export const deleteStage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.deleteStage(businessId, req.params.stageId);
  res.json({ success: true, data: null });
});

export const listDeals = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const { stageId, search } = req.query;
  const deals = await crmService.listDeals(businessId, {
    stageId: stageId as string,
    search: search as string,
  });
  res.json({ success: true, data: deals });
});

export const getDeal = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const deal = await crmService.getDeal(businessId, req.params.dealId);
  res.json({ success: true, data: deal });
});

export const createDeal = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const deal = await crmService.createDeal(businessId, req.body);
  res.status(201).json({ success: true, data: deal });
});

export const updateDeal = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const deal = await crmService.updateDeal(businessId, req.params.dealId, req.body);
  res.json({ success: true, data: deal });
});

export const moveDeal = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const deal = await crmService.moveDeal(businessId, req.params.dealId, req.body);
  res.json({ success: true, data: deal });
});

export const deleteDeal = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  await crmService.deleteDeal(businessId, req.params.dealId);
  res.json({ success: true, data: null });
});

export const getPipelineStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const stats = await crmService.getPipelineStats(businessId);
    res.json({ success: true, data: stats });
  }
);

export const seedDefaultStages = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    await crmService.seedDefaultStages(businessId);
    res.json({ success: true, message: 'Étapes par défaut créées' });
  }
);

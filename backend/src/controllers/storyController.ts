import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as storyService from '../services/storyService';
import { resolveBusinessAccess } from '../lib/businessAccess';

export const getActiveStories = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await storyService.getActiveStories(req.user?.id);
    res.json(successResponse(data));
  }
);

export const getBusinessStories = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.params;
    const data = await storyService.getBusinessStories(businessId, req.user?.id);
    res.json(successResponse(data));
  }
);

export const createStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await storyService.createStory({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Story créée'));
});

export const updateStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await storyService.updateStory(req.params.id, access.businessId, req.body);
  res.json(successResponse(data, 'Story mise à jour'));
});

export const viewStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await storyService.viewStory(req.params.id, req.user?.id, req.ip);
  res.json(successResponse({ viewed: true }));
});

export const clickStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await storyService.recordStoryClick(req.params.id);
  res.json(successResponse({ clicked: true }));
});

export const deleteStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  await storyService.deleteStory(req.params.id, access.businessId);
  res.json(successResponse(null, 'Story supprimée'));
});

export const addSticker = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await storyService.addStorySticker(req.params.id, access.businessId, req.body);
  res.json(successResponse(data, 'Sticker ajouté'));
});

export const removeSticker = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await storyService.removeStorySticker(
    req.params.id,
    access.businessId,
    req.params.stickerId
  );
  res.json(successResponse(data, 'Sticker supprimé'));
});

export const getHighlights = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await storyService.getBusinessHighlights(req.params.businessId);
  res.json(successResponse(data));
});

export const toggleHighlight = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const access = await resolveBusinessAccess({
      userId: req.user.id,
      roles: req.user.roles,
      bodyBusinessId: req.body?.businessId,
    });
    if (!access) {
      throw new AppError('Aucun business associé', 403);
    }
    const { isHighlight } = req.body;
    const data = await storyService.updateStory(req.params.id, access.businessId, { isHighlight });
    res.json(
      successResponse(data, isHighlight ? 'Ajouté aux highlights' : 'Retiré des highlights')
    );
  }
);

export const getFeedItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { types, page, limit, businessId } = req.query;
  const data = await storyService.getFeedItems({
    types: types ? (types as string).split(',') : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    businessId: businessId as string,
  });
  res.json(successResponse(data));
});

export const createFeedItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await storyService.createFeedItem({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Feed item créé'));
});

export const deleteFeedItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  await storyService.deleteFeedItem(req.params.id, access.businessId);
  res.json(successResponse(null, 'Feed item supprimé'));
});
